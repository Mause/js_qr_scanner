import requests
import tornado.web
import tornado.ioloop
import tornado.options

tornado.options.parse_command_line()


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write(open('index.html').read())


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

from os.path import dirname
application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/ticket/signin", Handler),
    (r"/(.*)", tornado.web.StaticFileHandler, {"path": dirname(__file__)})
], debug=True)

if __name__ == '__main__':
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()