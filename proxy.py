"""
A proxy whilst the api doesn't have the proper csrf headers
"""
import logging
from os.path import dirname

import jinja2
import requests
import tornado.web
import tornado.ioloop
import tornado.options
from webassets import Environment, Bundle
from react import jsx


tornado.options.parse_command_line()
logging.basicConfig(level=logging.DEBUG)

my_env = Environment('.', '.')


def react_filter(_in, out, **kw):
    out.write(jsx.transform_string(_in.read()))


def build_bundle():
    js = Bundle(
        'js/api.js', 'js/camera.js', 'js/main.jsx',
        filters=(react_filter, 'jsmin'),
        output='gen/packed.js'
    )
    my_env.register('js_all', js)
    return js


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        with open('index.html') as fh:
            data = fh.read()
        urls = my_env['js_all'].urls()

        self.write(
            jinja2.Template(data).render(urls=urls)
        )


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
    (r"/(.*)", tornado.web.StaticFileHandler, {"path": dirname(__file__)})
], debug=True)

if __name__ == '__main__':
    build_bundle()
    my_env['js_all'].urls()
    application.listen(8888, address='0.0.0.0')
    tornado.ioloop.IOLoop.instance().start()
