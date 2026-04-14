from flask import Flask, render_template, jsonify, request
from AFL_client import make_robot_client
import numpy as np
import re
import plotly.graph_objects as go
from plotly.io import to_html

app = Flask(__name__)

# Data and functions for fake balanced data, can be removed later

# --------------------------------------------------------------------------------------

FAKE_BALANCED = [
    {
        "step_fraction": 0.00,
        "ratios": {
            "NaC8": 0.10,
            "HC8": 0.15,
            "H2O": 0.75,
        },
    },
    {
        "step_fraction": 0.25,
        "ratios": {
            "NaC8": 0.18,
            "HC8": 0.22,
            "H2O": 0.60,
        },
    },
    {
        "step_fraction": 0.50,
        "ratios": {
            "NaC8": 0.28,
            "HC8": 0.30,
            "H2O": 0.42,
        },
    },
    {
        "step_fraction": 0.75,
        "ratios": {
            "NaC8": 0.40,
            "HC8": 0.35,
            "H2O": 0.25,
        },
    },
    {
        "step_fraction": 1.00,
        "ratios": {
            "NaC8": 0.52,
            "HC8": 0.38,
            "H2O": 0.10,
        },
    },
]

def interpolate_fake_profile(step_fraction):
    if not FAKE_BALANCED:
        return {}

    ordered = sorted(FAKE_BALANCED, key=lambda row: row["step_fraction"])

    if step_fraction <= ordered[0]["step_fraction"]:
        return dict(ordered[0]["ratios"])

    if step_fraction >= ordered[-1]["step_fraction"]:
        return dict(ordered[-1]["ratios"])

    for left, right in zip(ordered, ordered[1:]):
        left_f = left["step_fraction"]
        right_f = right["step_fraction"]

        if left_f <= step_fraction <= right_f:
            span = right_f - left_f
            t = 0.0 if span == 0 else (step_fraction - left_f) / span

            all_components = set(left["ratios"].keys()) | set(right["ratios"].keys())
            interpolated = {}

            for comp in all_components:
                left_val = left["ratios"].get(comp, 0.0)
                right_val = right["ratios"].get(comp, 0.0)
                interpolated[comp] = left_val + t * (right_val - left_val)

            return interpolated

    return dict(ordered[-1]["ratios"])

def build_fake_balanced_report(selected_solutions, sweep_configs):
    report = []

    sweep_map = {
        str(cfg.get("id")): {
            "solutionName": cfg.get("solutionName", ""),
            "start": float(cfg.get("start", 0)),
            "stop": float(cfg.get("stop", 0)),
            "step": float(cfg.get("step", 1)),
        }
        for cfg in sweep_configs
    }

    for solution_index, solution in enumerate(selected_solutions):
        solution_id = str(solution.get("id", ""))
        cfg = sweep_map.get(solution_id)
        if not cfg:
            continue

        start = cfg["start"]
        stop = cfg["stop"]
        step = cfg["step"]
        solution_name = cfg["solutionName"] or solution.get("solutionName") or f"Solution {solution_id}"

        step_values = build_step_values(start, stop, step)
        if not step_values:
            continue

        solution_scale = 1.0 + (solution_index * 0.08)

        for actual_step in step_values:
            if stop == start:
                step_fraction = 0.0
            else:
                step_fraction = (actual_step - start) / (stop - start)

            ratios = interpolate_fake_profile(step_fraction)

            concentrations = {
                component: f"{(ratio * 100.0 * solution_scale):.3f} mass%"
                for component, ratio in ratios.items()
            }

            report.append({
                "source_solution_id": solution_id,
                "solution_name": solution_name,
                "step_value": actual_step,
                "step_fraction": step_fraction,
                "balanced_target": {
                    "name": f"{solution_name}-step-{actual_step:g}",
                    "concentrations": concentrations,
                    "volumes": {},
                    "total_volume": "100 mass-units",
                }
            })

    return report

# --------------------------------------------------------------------------------------

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

def build_step_values(start, stop, step):
    if step <= 0:
        return []

    values = []
    current = start

    while current <= stop + 1e-9:
        values.append(round(current, 10))
        current += step

    return values

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
    z_axis = data.get("z_axis")
    selected_solutions = data.get("selected_solutions", [])
    sweep_configs = data.get("sweep_configs", [])

    if not x_axis or not y_axis:
        return jsonify({"ok": False, "error": "x_axis and y_axis are required"}), 400

    if not selected_solutions:
        return jsonify({"ok": False, "error": "At least one solution must be selected"}), 400

    try:
        # ACTUAL FUNCTIONAL BALANCING CODE
        # robot, error_response = get_robot_or_error()
        # if error_response:
        #     return error_response
        #
        # robot.enqueue(task_name="reset_targets")
        #
        # sweep_map = {
        #     str(cfg.get("id")): {
        #         "solutionName": cfg.get("solutionName", ""),
        #         "start": float(cfg.get("start", 0)),
        #         "stop": float(cfg.get("stop", 0)),
        #         "step": float(cfg.get("step", 1)),
        #     }
        #     for cfg in sweep_configs
        # }
        #
        # for solution in selected_solutions:
        #     masses = {}
        #
        #     for comp in solution.get("components", []):
        #         comp_name = (comp.get("name") or "").strip()
        #         comp_amount = str(comp.get("amount") or "").strip()
        #         comp_unit = (comp.get("unit") or "").strip()
        #
        #         if not comp_name or not comp_amount or not comp_unit:
        #             continue
        #
        #         masses[comp_name] = f"{comp_amount}{comp_unit}"
        #
        #     if not masses:
        #         continue
        #
        #     robot.enqueue(
        #         task_name="add_stock",
        #         solution=dict(
        #             name=solution.get("solutionName", "Unnamed Solution"),
        #             masses=masses,
        #             location=solution.get("location", ""),
        #         )
        #     )
        #
        # targets = []
        #
        # for solution in selected_solutions:
        #     solution_id = str(solution.get("id", ""))
        #     cfg = sweep_map.get(solution_id)
        #     if not cfg:
        #         continue
        #
        #     start = cfg["start"]
        #     stop = cfg["stop"]
        #     step = cfg["step"]
        #     solution_name = cfg["solutionName"] or solution.get("solutionName") or f"Solution {solution_id}"
        #
        #     step_values = build_step_values(start, stop, step)
        #     if not step_values:
        #         continue
        #
        #     for actual_step in step_values:
        #         targets.append({
        #             "name": f"{solution_name}-step-{actual_step:g}",
        #             "volumes": {
        #                 solution_name: f"{actual_step:g}ul"
        #             },
        #             "total_volume": f"{actual_step:g} ul",
        #         })
        #
        # if not targets:
        #     return jsonify({
        #         "ok": False,
        #         "error": "No valid targets could be created from the selected solutions"
        #     }), 400
        #
        # robot.enqueue(task_name="add_targets", targets=targets)
        #
        # result = robot.enqueue(
        #     task_name="balance",
        #     return_report=True,
        #     interactive=True
        # )
        #
        # report = result["return_val"]
        # balanced = [s for s in report if s.get("balanced_target") is not None]

        # TEMPORARY OFFLINE TEST DATA
        report = build_fake_balanced_report(selected_solutions, sweep_configs)
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

            label = (
                f"{s.get('solution_name', 'Unknown Solution')}<br>"
                f"step={s.get('step_value')}<br>"
                f"{bt.get('name', '')}"
            )

            if z_axis:
                z_val = extract_axis_value(bt, z_axis)
                if z_val is None:
                    continue
                z_vals.append(z_val)

            x_vals.append(x_val)
            y_vals.append(y_val)
            point_labels.append(label)

        if not x_vals:
            return jsonify({
                "ok": False,
                "error": "No graphable points found for the selected axes and sweep settings"
            }), 400

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

        fig.update_layout(
            autosize=True,
            margin=dict(l=20, r=20, t=40, b=20)
        )

        graph_html = to_html(
            fig,
            full_html=False,
            include_plotlyjs=True,
            config={"responsive": True}
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