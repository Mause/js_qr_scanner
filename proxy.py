"""
A proxy whilst the api doesn't have the proper csrf headers
"""
import os
import json
import base64
import logging
import platform
from io import BytesIO
from pprint import pprint
from os.path import join, exists, expandvars

import flask
import qrcode
import requests

from webassets_babel import BabelFilter
from webassets import Environment, Bundle
from webassets.exceptions import FilterError
from webassets.filter import register_filter

logging.basicConfig(level=logging.DEBUG)

app = flask.Flask(__name__)
my_env = Environment(directory='static/', url='static/')
my_env.debug = 'HEROKU' not in os.environ

if platform.system() == 'Windows':
    npm = expandvars('%AppData%/npm')
    my_env.config.setdefault('BABEL_BIN', join(npm, 'babel.cmd'))
    PRESET_PATH = join(npm, "node_modules/RedQR/")
else:
    PRESET_PATH = "/app/"
PRESET_PATH = join(PRESET_PATH, "node_modules")
assert exists(PRESET_PATH)
PRESETS = ['react', 'es2015']
PRESETS = ','.join(
    join(PRESET_PATH, 'babel-preset-{}'.format(name))
    for name in PRESETS
)


@register_filter
class BetterBabelFilter(BabelFilter):
    def get_executable_list(self, input_filename, output_filename):
        return (
            super().get_executable_list(input_filename, output_filename) +
            ['--presets', PRESETS]
        )


def build_bundles():
    js = Bundle(
        'js/api.js',
        'js/camera.js',
        'js/qr_scanner.jsx',
        'js/screen.jsx',
        'js/options.jsx',
        'js/main.jsx',
        filters=(
            'babel',
            # 'jsmin'
        ),
        output='gen/packed.js'
    )
    js.config.babel_options = {
        'highlightCode': False,
    }
    my_env.register('js_all', js)
    deps = Bundle(
        "js/vendor/jquery.dev.js",
        "js/vendor/foundation.min.js",
        "js/vendor/llqrcode.js",
        "js/vendor/modernizr-latest.js",
        "js/vendor/underscore.js",
        "js/vendor/react/react-with-addons.js",
        "js/vendor/react/react-dom.js",
        filters='jsmin',
        output='gen/deps.js'
    )
    my_env.register('deps', deps)
    return my_env


def get_urls():
    try:
        urls = my_env['js_all'].urls()
        deps = my_env['deps'].urls()

        pprint(urls + deps)

        return deps + urls
    except FilterError as e:
        e.args = (e.args[0].replace('\\n', '\n'),)
        raise e


@app.route("/")
def index():
    return flask.render_template('index.html', urls=get_urls())


def build_image(data):
    img = qrcode.make(data)

    fh = BytesIO()
    img.save(fh)
    b64 = base64.b64encode(fh.getvalue())

    return b'data:image/png;base64,' + b64


@app.route("/tests")
def tests():
    with open('static/tests.json') as fh:
        tests = json.load(fh)

    images = {
        k: {
            "desc": v['desc'],
            "img": build_image(k).decode()
        }
        for k, v in tests.items()
    }

    return flask.render_template('tests.html', tests=images)


@app.route("/ticket/signin")
def proxy_signin():
    r = requests.request(
        flask.request.method,
        'http://events.rflan.org/ticket/signin',
        params=flask.request.args
    )
    if not r.ok:
        print(r.text)
        raise flask.HTTPError(r.status_code)
    return r.text


@app.route(r"/.well-known/acme-challenge.*")
def lets_encrypt():
    return os.environ.get(
        'LETS_ENCRYPT_CHALLENGE',
        'not set'
    )


if __name__ == '__main__':
    print('building bundles')
    build_bundles()
    get_urls()
    print('bundles built')

    app.run('0.0.0.0', os.environ.get("PORT", 8888), my_env.debug)
