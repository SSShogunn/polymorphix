import time
from config import channel, connection
import sys
import os
import random as num_gen

channel.queue_declare(queue="hello")


def main():
    while True:
        number = num_gen.random()
        body = str(number)
        channel.basic_publish(exchange="", routing_key="hello", body=body)
        print(f" [x] Sent {body}")
        time.sleep(0.2)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted")
        try:
            connection.close()
            sys.exit(0)
        except SystemExit:
            os._exit(0)
