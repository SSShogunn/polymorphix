import pika

credentials = pika.PlainCredentials(
    username="polymorphix",
    password="8e01ea1aed98288f4219ad061bb432be",
)

parameters = pika.ConnectionParameters(
    host="localhost",  # or "polymorphix-rabbitmq" if calling from another container
    port=5672,
    credentials=credentials,
)

connection = pika.BlockingConnection(parameters)
channel = connection.channel()