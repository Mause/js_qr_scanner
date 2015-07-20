"""
A proxy whilst the api doesn't have the proper csrf headers
"""
import os
import json
import base64
import logging
from io import BytesIO
from os.path import dirname

import qrcode
import requests
import tornado.web
import tornado.ioloop
import tornado.options
from webassets import Environment, Bundle
from webassets.filter import register_filter
from webassets_babel import BabelFilter

register_filter(BabelFilter)

tornado.options.parse_command_line()
logging.basicConfig(level=logging.DEBUG)

my_env = Environment('.', '.')
my_env.debug = False

my_env.config.setdefault(
    'BABEL_BIN',
    'C:\\Users\\Dominic\\AppData\\Roaming\\npm\\babel.cmd'
)


def build_bundles():
    js = Bundle(
        'js/api.js', 'js/camera.js', 'js/main.jsx',
        filters=(
            'babel',
            # 'jsmin'
        ),
        output='gen/packed.js'
    )
    my_env.register('js_all', js)
    deps = Bundle(
        "js/vendor/jquery.dev.js",
        "js/vendor/foundation.min.js",
        "js/vendor/llqrcode.js",
        "js/vendor/modernizr-latest.js",
        "js/vendor/underscore.js",
        "js/vendor/react/react-with-addons.js",
        filters='jsmin',
        output='gen/deps.js'
    )
    my_env.register('deps', deps)
    return my_env


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        urls = my_env['js_all'].urls()
        deps = my_env['deps'].urls()

        return self.render('index.html', urls=urls, deps=deps)


def build_image(data):
    img = qrcode.make(data)

    fh = BytesIO()
    img.save(fh)
    b64 = base64.b64encode(fh.getvalue())

    return b'data:image/png;base64,' + b64


class TestsHandler(tornado.web.RequestHandler):
    def get(self):
        with open('tests.json') as fh:
            tests = json.load(fh)

        images = {
            k: {
                "desc": v['desc'],
                "img": build_image(k).decode()
            }
            for k, v in tests.items()
        }

        return self.render('tests.html', tests=images)


def do(func):
    def handler(self):
        r = func(
            'http://events.rflan.org/ticket/signin',
            params=self.request.arguments
        )
        if not r.ok:
            print(r.text)
            raise tornado.web.HTTPError(r.status_code)
        self.write(r.text)
    return handler


class Handler(tornado.web.RequestHandler):
    get = do(requests.get)
    post = do(requests.post)

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/ticket/signin", Handler),
    (r"/tests", TestsHandler),
    (r"/(.*)", tornado.web.StaticFileHandler, {"path": dirname(__file__)})
], debug=True)

if __name__ == '__main__':
    build_bundles()
    my_env['js_all'].urls()
    application.listen(os.environ.get("PORT", 8888), address='0.0.0.0')
    tornado.ioloop.IOLoop.instance().start()
