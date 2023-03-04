import {useEffect, useRef, useState} from 'react'
import {io} from "socket.io-client"
import {MessageList, MessageType} from "react-chat-elements";
import "react-chat-elements/dist/main.css"
import {v4} from "uuid"
import {Button} from "@components/ui/button";
import {Textarea} from "@components/ui/textArea";

const generateUserMessage = ({text}: { text: string }): MessageType => ({
    text,
    type: 'text',
    title: "User",
    position: "right",
    focus: false,
    date: new Date(),
    forwarded: false,
    notch: true,
    removeButton: false,
    replyButton: false,
    retracted: false,
    status: "sent",
    titleColor: "0f172a",
    reply: undefined,
    id: v4()
})

const generateAssistantMessage = ({text}: { text: string }): MessageType => ({
    text,
    type: 'text',
    title: "Lewis",
    position: "left",
    focus: false,
    date: new Date(),
    forwarded: false,
    notch: true,
    removeButton: false,
    replyButton: false,
    retracted: false,
    status: "received",
    titleColor: "0f172a",
    reply: undefined,
    id: v4()
})
const socket = io("http://localhost:50035", {transports: ['websocket']})

function App() {
    const [messages, setMessages] = useState<MessageType[]>([
        // generateAssistantMessage({text: "Hello, how can I help"})
    ])
    const [messageText, setMessageText] = useState<string>()

    const addAssistantMessage = (text: string) => {
        setMessages(a => [...a, generateAssistantMessage({text})])
    }

    const addUserMessage = (text: string) => {
        setMessages(a => [...a, generateUserMessage({text})])
    }

    const handleSend = () => {
        if (!messageText) throw new Error("No message text")
        sendMessage()
        addUserMessage(messageText)
        setMessageText("")
    }

    useEffect(() => {

        socket.on("newAssistantMessage", (a: IncomingAssistantMessage) => {
            addAssistantMessage(a.message)
        })

        return () => {
            socket.off("newAssistantMessage")
        }
    }, [])

    type IncomingAssistantMessage = {
        message: string
    }


    const sendMessage = () => {
        socket.emit("newUserMessage", {message: messageText})
    }
    const ref = useRef(null)


    return (
        <div className="w-screen h-screen border flex items-center justify-center">
            <div className="flex flex-col w-2/4 h-4/5 border border-red-500">
                <div className="flex-1 p-2 overflow-scroll">

                    <MessageList referance={ref} dataSource={messages} lockable={false}/>
                </div>
                <div className="flex flex-0 flex-row place-self-end w-full">
                    <Textarea value={messageText} onChange={a => setMessageText(a.target.value)} autoComplete="off"/>
                    <Button onClick={handleSend}>Send</Button>
                </div>
            </div>
        </div>
    )
}

export default App
