#!/usr/bin/env python3
"""
Simple HTTP server for Krushi Mitra static frontend
Serves files on port 5000 with proper CORS headers and cache control
"""
import http.server
import socketserver
import os
from functools import partial

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with cache control and CORS headers"""
    
    def end_headers(self):
        # Disable caching for HTML files to ensure updates are visible
        if self.path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        # Enable CORS for API calls (if backend is running separately)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()

PORT = 5000
Handler = NoCacheHTTPRequestHandler

print(f"🌱 Krushi Mitra Server Starting...")
print(f"📍 Server running at http://0.0.0.0:{PORT}")
print(f"🌐 Access the application through the Replit webview")
print(f"💡 Mock mode enabled - backend API calls will fallback to local data")

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.shutdown()
