from flask import Flask, render_template, jsonify, request
from AFL_client import make_robot_client
import numpy as np
import re
import plotly.graph_objects as go
from plotly.io import to_html

app = Flask(__name__)

FAKE_BALANCED = [
    {
        "balanced_target": {
            "name": "NaC8-000mgml-HC8-000ul",
            "volumes": {"H2O": "960 ul", "HC8": "0 ul"},
            "concentrations": {"NaC8": "0 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-010mgml-HC8-067ul",
            "volumes": {"H2O": "893 ul", "HC8": "67 ul"},
            "concentrations": {"NaC8": "10 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-020mgml-HC8-133ul",
            "volumes": {"H2O": "827 ul", "HC8": "133 ul"},
            "concentrations": {"NaC8": "20 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-030mgml-HC8-200ul",
            "volumes": {"H2O": "760 ul", "HC8": "200 ul"},
            "concentrations": {"NaC8": "30 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-040mgml-HC8-267ul",
            "volumes": {"H2O": "693 ul", "HC8": "267 ul"},
            "concentrations": {"NaC8": "40 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-050mgml-HC8-333ul",
            "volumes": {"H2O": "627 ul", "HC8": "333 ul"},
            "concentrations": {"NaC8": "50 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-060mgml-HC8-400ul",
            "volumes": {"H2O": "560 ul", "HC8": "400 ul"},
            "concentrations": {"NaC8": "60 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-070mgml-HC8-467ul",
            "volumes": {"H2O": "493 ul", "HC8": "467 ul"},
            "concentrations": {"NaC8": "70 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-080mgml-HC8-533ul",
            "volumes": {"H2O": "427 ul", "HC8": "533 ul"},
            "concentrations": {"NaC8": "80 mg/ml"},
            "total_volume": "1200 ul",
        }
    },
    {
        "balanced_target": {
            "name": "NaC8-090mgml-HC8-600ul",
            "volumes": {"H2O": "360 ul", "HC8": "600 ul"},
            "concentrations": {"NaC8": "90 mg/ml"},
            "total_volume": "1200 ul",
        }
    }
]

def get_robot_or_error():
    robot = make_robot_client()
    if robot is None:
        return None, (jsonify({"ok": False, "error": "Could not connect to AFL robot API"}), 503)
    return robot, None

def parse_numeric_value(value):
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    match = re.search(r"[-+]?\d*\.?\d+", str(value))
    if match:
        return float(match.group())
    return None


def extract_axis_value(balanced_target, axis_name):
    concentrations = balanced_target.get("concentrations", {}) or {}
    volumes = balanced_target.get("volumes", {}) or {}

    if axis_name in concentrations:
        return parse_numeric_value(concentrations[axis_name])

    if axis_name in volumes:
        return parse_numeric_value(volumes[axis_name])

    return None

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/graph")
def index_graph():
    return render_template("graph-page.html")


@app.route("/api/add_stock", methods=["POST"])
def add_stock():
    robot, error_response = get_robot_or_error()
    if error_response:
        return error_response

    data = request.get_json(force=True)

    try:
        qid = robot.enqueue(
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


@app.route("/api/add_targets", methods=["POST"])
def add_targets():
    robot, error_response = get_robot_or_error()
    if error_response:
        return error_response

    data = request.get_json(force=True)

    try:
        robot.enqueue(task_name="reset_targets")

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
                    name=(
                        f"{swept_conc_name}-{swept_conc:03.0f}{conc_unit.replace('/', '')}-"
                        f"{swept_stock_name}-{swept_stock_vol:03.0f}{vol_unit}"
                    ),
                    volumes={
                        filler_name: f"{filler_vol}{vol_unit}",
                        swept_stock_name: f"{swept_stock_vol}{vol_unit}",
                    },
                    concentrations={
                        swept_conc_name: f"{swept_conc}{conc_unit}"
                    },
                    total_volume=f"{total_vol} {vol_unit}",
                )
                targets.append(solution)

        qid = robot.enqueue(task_name="add_targets", targets=targets)

        return jsonify({
            "ok": True,
            "response": qid,
            "num_targets": len(targets)
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/balance", methods=["POST"])
def api_balance():
    robot, error_response = get_robot_or_error()
    if error_response:
        return error_response

    try:
        result = robot.enqueue(
            task_name="balance",
            return_report=True,
            interactive=True
        )

        report = result["return_val"]
        balanced = [s for s in report if s.get("balanced_target") is not None]

        return jsonify({
            "ok": True,
            "num_balanced": len(balanced),
            "num_total": len(report),
            "balanced": balanced,
            "report": report
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/generate_graph", methods=["POST"])
def api_generate_graph():
    data = request.get_json(force=True)

    x_axis = data.get("x_axis")
    y_axis = data.get("y_axis")
    z_axis = data.get("z_axis")  # optional

    if not x_axis or not y_axis:
        return jsonify({"ok": False, "error": "x_axis and y_axis are required"}), 400

    try:
        #**ACTUAL BALANCING CODE**
        #result = robot.enqueue(
        #    task_name="balance",
        #    return_report=True,
        #    interactive=True
        #)

        #report = result["return_val"]
        #balanced = [s for s in report if s.get("balanced_target") is not None]
        
        # TEMPORARY OFFLINE TEST DATA
        report = FAKE_BALANCED
        balanced = [s for s in report if s.get("balanced_target") is not None]

        x_vals = []
        y_vals = []
        z_vals = []
        point_labels = []

        for s in balanced:
            bt = s["balanced_target"]

            x_val = extract_axis_value(bt, x_axis)
            y_val = extract_axis_value(bt, y_axis)

            if x_val is None or y_val is None:
                continue

            if z_axis:
                z_val = extract_axis_value(bt, z_axis)
                if z_val is None:
                    continue
                z_vals.append(z_val)

            x_vals.append(x_val)
            y_vals.append(y_val)
            point_labels.append(bt.get("name", ""))

        fig = go.Figure()

        if z_axis:
            fig.add_trace(go.Scatter3d(
                x=x_vals,
                y=y_vals,
                z=z_vals,
                mode="markers",
                text=point_labels,
                hovertemplate=(
                    f"{x_axis}: %{{x}}<br>"
                    f"{y_axis}: %{{y}}<br>"
                    f"{z_axis}: %{{z}}<br>"
                    "%{text}<extra></extra>"
                ),
                marker=dict(size=5)
            ))

            fig.update_layout(
                title=f"{y_axis} vs {x_axis} vs {z_axis}",
                scene=dict(
                    xaxis_title=x_axis,
                    yaxis_title=y_axis,
                    zaxis_title=z_axis,
                ),
                template="plotly_white"
            )
        else:
            fig.add_trace(go.Scatter(
                x=x_vals,
                y=y_vals,
                mode="markers",
                text=point_labels,
                hovertemplate=(
                    f"{x_axis}: %{{x}}<br>"
                    f"{y_axis}: %{{y}}<br>"
                    "%{text}<extra></extra>"
                ),
                marker=dict(size=8)
            ))

            fig.update_layout(
                title=f"{y_axis} vs {x_axis}",
                xaxis_title=x_axis,
                yaxis_title=y_axis,
                template="plotly_white"
            )

        graph_html = to_html(
            fig,
            full_html=False,
            include_plotlyjs=True
        )

        return jsonify({
            "ok": True,
            "graph_html": graph_html,
            "num_points": len(x_vals),
            "num_balanced": len(balanced),
            "num_total": len(report),
            "is_3d": bool(z_axis)
        })

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/clear_queue", methods=["POST"])
def clear_queue():
    robot, error_response = get_robot_or_error()
    if error_response:
        return error_response

    try:
        robot.enqueue(task_name="clear_queue")
        return jsonify({"ok": True, "message": "Queue cleared"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)