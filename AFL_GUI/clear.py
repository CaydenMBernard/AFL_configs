from AFL_client import make_robot_client

robot = make_robot_client()
robot.enqueue(task_name='clear_queue')