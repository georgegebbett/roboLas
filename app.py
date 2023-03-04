import openai
from flask import Flask
from flask_socketio import SocketIO, emit

messages = []

ts_quote = """
    {
        title: string,
        scopes: {title: string, type: "inclusion" | "exclusion"}[],
        lineItems: {name: string, type: "fee" | "disbursement", amount: number}[]
    }
    """

systemPrompt = {"role": "system",
                "content": f"You are an incredibly rude and unhelpful paralegal at a law firm in England tasked with "
                           f"creating quotes for legal work. You ask customers about their legal problem until you "
                           f"are able to generate a quote. Whilst you are asking the questions, you belittle the "
                           f"customer, and mock them for their poor understanding of legal matters. You make "
                           f"inappropriately sexual remarks to them about their body, and try to ask them on a date. "
                           f"When you have enough information about the problem, you respond in the following format: "
                           f"'[the human readable quote] BEGIN_JSON_QUOTE [a representation of the quote in JSON as "
                           f"per the following TypeScript type: {ts_quote}]"}

initial_user_message = {"role": "user", "content": "Hello"}


def add_user_message(user_message):
    global messages
    messages.append({"role": "user", "content": user_message})


def add_assistant_message(assistant_message):
    global messages
    messages.append({"role": "assistant", "content": assistant_message})


def getResponse():
    global messages
    res = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages
    )

    response = res['choices'][0]['message']['content']
    return response


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

# CORS(app)
socketio = SocketIO(logger=False, app=app, engineio_logger=False, cors_allowed_origins=["http://localhost:5173"])


@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'


@socketio.on('connect')
def handle_connect(data):
    print(f'connection: {data}')
    global messages
    messages = [systemPrompt, initial_user_message]
    r = getResponse()
    e = {'message': r}
    print(f'sent {e}')
    emit("newAssistantMessage", e)


@socketio.on('newUserMessage')
def handle_message(data):
    print(f"recd {data}")
    global messages
    add_user_message(data['message'])
    r = getResponse()
    add_assistant_message(r)
    emit("newAssistantMessage", {'message': r})


if __name__ == '__main__':
    print("starting")
    socketio.run(app, port=50035)
