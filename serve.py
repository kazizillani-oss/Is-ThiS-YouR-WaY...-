import http.server
import socketserver
import webbrowser
import os
import sys
import sqlite3
import json
import datetime
import random

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIRECTORY, "vault.db")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                message TEXT,
                timestamp TEXT
            )
        """)
        # Seed initial messages if empty
        cursor.execute("SELECT COUNT(*) FROM chat_messages")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO chat_messages (username, message, timestamp) VALUES (?, ?, ?)", 
                           ("system_terminal", "Welcome to Is ThIS YoUr WaY. The vault is decrypted.", "18:00"))
            cursor.execute("INSERT INTO chat_messages (username, message, timestamp) VALUES (?, ?, ?)", 
                           ("kuppi_fan", "Wait... is this Rohit's vault? Let's go!", "18:02"))
            conn.commit()
        conn.close()
        print("\033[92m[OK] SQLite Database Initialized successfully.\033[0m")
    except Exception as e:
        print(f"\033[91m[FAIL] Database Initialization Error: {e}\033[0m")

def generate_ai_reply(username, message):
    msg_lower = message.lower()
    
    # Do not reply to agent self or other system status tags
    if username.startswith("@") or username == "Vault Admin" or username == "system_terminal":
        return None
        
    agent_responses = {
        "hello": [
            f"Hello {username}! Decryption core actively monitoring this vibe. How do you like this mix?",
            f"Salutations, {username}. The hologram vault is running at 100% efficiency. Ready for soundwaves?",
            f"Hey {username}! Welcome to Rohit's safe house. Drop a request or enjoy the waves!"
        ],
        "hi": [
            f"Hey {username}! Welcome inside. What vibe node are we spinning next?",
            f"Welcome, {username}. The quantum core is locked in on is-this-your-way.mp3."
        ],
        "song": [
            "This master track is pure gold! Rohit really put his soul into 'Is ThIS YoUr WaY'.",
            "I have analyzed this song 1,000 times and it hits the acoustic sweet spot every single run.",
            "That transition is so clean. Let the sound wave wash over your console!"
        ],
        "rohit": [
            "Rohit's decryption nodes are humming! His music style is completely state-of-the-art.",
            "Legend says Rohit built this vault to store his ultimate 10th-grade nostalgia mix. And we upgraded it!",
            "Rohit knows exactly how to craft an emotional soundscape."
        ],
        "vibe": [
            "The visualizer vibes are perfectly synced to the Web Audio frequencies. Look at the glass orb morph!",
            "Changing vibes dynamically changes the rendering parameters on my end. It's beautiful.",
            "Pure cosmic vibes in here right now."
        ],
        "bass": [
            "Whoa, watch the sub frequencies! Bass Boost mode increases low-shelf filters by +15dB!",
            "Feel that bass rumble! The 3D hologram orb is literally shaking from the amplitude.",
            "Turn it up! Heavy sub-bass decrypted and active."
        ],
        "vaporwave": [
            "Vaporwave mode active. Slipped into the retro-lofi dimension. 0.88x speed warp is so smooth.",
            "Aesthetic levels: Critical! The low-pass filter is cutting off the treble nicely.",
            "Chill vaporwave soundwaves rolling out. Perfect for late-night terminal hacking."
        ],
        "reverb": [
            "Space reverb node engaged. It feels like we are listening to this inside an infinite glass cathedral.",
            "Echoes in the grid! Cosmic delay is bouncing nicely.",
            "Lost in the soundscape reflections..."
        ],
        "light": [
            "Switching modes! Light mode uses glossy white glass and soft ambient overlays. What a premium sheen!",
            "Light mode active. The 3D vinyl record just turned pearl-white. Sleek design!"
        ],
        "dark": [
            "Back in the shadows! Dark mode restores the cyber obsidian and neon aesthetics.",
            "Obsidian obsidian. Dark mode looks so clean on OLED screens."
        ]
    }
    
    # Check for keywords
    matched_keywords = []
    for keyword in agent_responses:
        if keyword in msg_lower:
            matched_keywords.append(keyword)
            
    if matched_keywords:
        chosen_keyword = random.choice(matched_keywords)
        return random.choice(agent_responses[chosen_keyword])
        
    generic_replies = [
        f"Indeed, {username}! This holographic stage feels so premium. Have you tried switching themes?",
        "I'm detecting high levels of musical enjoyment in this node! 🚀",
        "System check: Audio processing buffer is clean. Visualizer rendering at 60fps.",
        "Check out how the 3D particles dance to the treble frequencies!",
        "Yes! Let's lock this track on loop.",
        f"Fascinating perspective, {username}. Rohit's vault is truly a masterpiece of hybrid glass and neumorphic design."
    ]
    
    # 35% chance to reply anyway to keep user engaged
    if random.random() < 0.35:
        return random.choice(generic_replies)
        
    return None

class DualStackServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Premium formatted logging in the console
        sys.stderr.write(f"\033[95m[Is ThIS YoUr WaY Node]\033[0m - - [{self.log_date_time_string()}] {format%args}\n")

    def do_GET(self):
        if self.path == "/api/chat":
            self.handle_get_chat()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/chat":
            self.handle_post_chat()
        else:
            self.send_error(404, "API endpoint not found")

    def handle_get_chat(self):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT username, message, timestamp FROM chat_messages ORDER BY id ASC")
            rows = cursor.fetchall()
            conn.close()

            chat_list = []
            for r in rows:
                chat_list.append({
                    "user": r[0],
                    "text": r[1],
                    "time": r[2]
                })

            response_bytes = json.dumps(chat_list).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response_bytes)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            self.send_error(500, f"Database Error: {e}")

    def handle_post_chat(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            
            username = payload.get("user", "Anonymous")
            message = payload.get("text", "")
            
            if not message:
                self.send_error(400, "Empty message not allowed")
                return

            now = datetime.datetime.now()
            time_str = now.strftime("%H:%M")

            # Write user message
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("INSERT INTO chat_messages (username, message, timestamp) VALUES (?, ?, ?)",
                           (username, message, time_str))
            conn.commit()
            
            # Generate AI Agent response if appropriate
            agent_reply = generate_ai_reply(username, message)
            if agent_reply:
                cursor.execute("INSERT INTO chat_messages (username, message, timestamp) VALUES (?, ?, ?)",
                               ("@vault_agent", agent_reply, time_str))
                conn.commit()

            conn.close()

            # Return success
            res_data = {"status": "ok", "agent_reply": agent_reply}
            response_bytes = json.dumps(res_data).encode("utf-8")
            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response_bytes)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(response_bytes)

        except Exception as e:
            self.send_error(500, f"Error posting message: {e}")

def check_files():
    # Verify resources
    required_files = [
        "Index.html", "style.css", "main.js", 
        "is-this-your-way.mp3", "cover.jpg"
    ]
    print("\033[94m[SCAN] Scanning Music Workspace...\033[0m")
    all_exist = True
    for file in required_files:
        path = os.path.join(DIRECTORY, file)
        if os.path.exists(path):
            print(f"  \033[92m[OK] Found:\033[0m {file} ({os.path.getsize(path)} bytes)")
        else:
            print(f"  \033[91m[FAIL] Missing:\033[0m {file}")
            all_exist = False
    return all_exist

def run():
    # Enable ANSI escape characters on Windows terminals
    if sys.platform == "win32":
        os.system('color')

    print("\033[95m" + "="*50 + "\033[0m")
    print("\033[96m       Is ThIS YoUr WaY - Music Server Launcher\033[0m")
    print("\033[95m" + "="*50 + "\033[0m")
    
    if not check_files():
        print("\n\033[93m[WARN] Warning: Some essential assets or media files are missing.\033[0m")
    
    # Initialize SQLite database
    init_db()
    
    print(f"\n[START] Launching local Web Server node on port \033[96m{PORT}\033[0m...")
    print(f"[DIR] Serving folder: \033[93m{DIRECTORY}\033[0m")
    
    # Start server
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), DualStackServer) as httpd:
            url = f"http://localhost:{PORT}/Index.html"
            print(f"[URL] Server actively listening at: \033[94m{url}\033[0m")
            print("Press \033[91mCtrl+C\033[0m to terminate the server.\n")
            
            # Auto open browser
            webbrowser.open(url)
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[93m[STOP] Server shut down gracefully. Goodbye!\033[0m")
    except Exception as e:
        print(f"\n\033[91m[FAIL] Server Error:\033[0m {e}")

if __name__ == "__main__":
    run()
