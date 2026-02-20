from flask import Flask, render_template, jsonify
from AFL_client import make_robot_client

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/test', methods=['GET'])
def api_test():
    robot = make_robot_client()
    if robot is None:
        return jsonify({"ok": False, "error": "Could not connect to AFL robot API"}), 503

    try:
        resp = robot.enqueue(task_name="reset_stocks")
        return jsonify({"ok": True, "response": resp})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5001, debug=True)
