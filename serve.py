#!/usr/bin/env python3
"""Cartographer icin basit lokal HTTP sunucusu.  Kullanim: python3 serve.py [port]"""
import http.server, socketserver, sys, os, webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    url = f"http://localhost:{PORT}/"
    print(f"Cartographer calisiyor: {url}   (durdurmak icin Ctrl+C)")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    httpd.serve_forever()
