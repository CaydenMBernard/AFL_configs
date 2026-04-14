import os
import warnings
from AFL.automation.APIServer.Client import Client

AFL_HOST = os.getenv("AFL_HOST", "127.0.0.1")
ROBOT_PORT = int(os.getenv("AFL_ROBOT_PORT", "5000"))

def make_robot_client():
    try:
        c = Client(ip=AFL_HOST, port=ROBOT_PORT)
        
        try:
            c.login("flask")
        except Exception as login_error:
            warnings.warn(f"Login skipped/failed, continuing anyway: {login_error}")

        return c
    except Exception as e:
        warnings.warn(f"Unable to connect to Robot API at http://{AFL_HOST}:{ROBOT_PORT}: {e}")
        return None