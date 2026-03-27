from flask import Flask, render_template, jsonify, request
from AFL_client import make_robot_client
import numpy as np

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

@app.route('/add_stock', methods=['POST'])
def add_stock():
    data = request.get_json(force=True)
    
    try:
        qid = robot_client.enqueue(
            task_name="add_stock",
            solution=dict(
                name=data["name"],
                masses=data["masses"],
                location=data["location"],
            )
        )
        return jsonify({"ok": True, "response": qid})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    
@app.route('/api/add_targets', methods=['POST'])
def add_targets():
    data = request.get_json(force=True)

    try:
        robot_client.enqueue(task_name='reset_targets')

        total_vol = float(data["total_vol"])
        fill_fraction = float(data["fill_fraction"])

        swept_conc_name = data["swept_conc_name"]
        swept_stock_name = data["swept_stock_name"]
        filler_name = data["filler_name"]

        conc_min = float(data["conc_min"])
        conc_max = float(data["conc_max"])
        conc_steps = int(data["conc_steps"])

        stock_vol_min = float(data["stock_vol_min"])
        stock_vol_max = float(data["stock_vol_max"])
        stock_vol_steps = int(data["stock_vol_steps"])

        vol_unit = data.get("vol_unit", "ul")
        conc_unit = data.get("conc_unit", "mg/ml")

        targets = []

        for swept_conc in np.linspace(conc_min, conc_max, conc_steps):
            for swept_stock_vol in np.linspace(stock_vol_min, stock_vol_max, stock_vol_steps):
                filler_vol = fill_fraction * total_vol - swept_stock_vol
                if filler_vol < 0:
                    continue

                solution = dict(
                    name=f'{swept_conc_name}-{swept_conc:03.0f}{conc_unit.replace("/", "")}-{swept_stock_name}-{swept_stock_vol:03.0f}{vol_unit}',
                    volumes={
                        filler_name: f'{filler_vol}{vol_unit}',
                        swept_stock_name: f'{swept_stock_vol}{vol_unit}'
                    },
                    concentrations={
                        swept_conc_name: f'{swept_conc}{conc_unit}'
                    },
                    total_volume=f'{total_vol} {vol_unit}',
                )
                targets.append(solution)

        qid = robot_client.enqueue(task_name='add_targets', targets=targets)

        return jsonify({
            "ok": True,
            "response": qid,
            "num_targets": len(targets)
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    
@app.route('/api/balance', methods=['POST'])
def api_balance():
    robot_client = make_robot_client()
    if robot_client is None:
        return jsonify({"ok": False, "error": "Could not connect to AFL robot API"}), 503

    try:
        result = robot_client.enqueue(
            task_name='balance',
            return_report=True,
            interactive=True
        )

        report = result['return_val']
        balanced = [s for s in report if s.get('balanced_target') is not None]

        return jsonify({
            "ok": True,
            "num_balanced": len(balanced),
            "num_total": len(report),
            "balanced": balanced,
            "report": report
        })

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == '__main__':
    robot_client = make_robot_client()
    if robot_client is None:
        print("Warning: Could not connect to AFL robot API.")

    app.run(host="127.0.0.1", port=5001, debug=True)
