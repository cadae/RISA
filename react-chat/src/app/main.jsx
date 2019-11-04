import React from 'react';
import ReactDOM from 'react-dom';
import { Chat, HeroCard } from '@progress/kendo-react-conversational-ui';
import { questions } from './sample_questions';
import { Calendar } from '@progress/kendo-react-dateinputs';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.askedQuestions = [""]
        this.detailedAnswerStr = ""
        this.detailedAnswerFlag = false
        this.user = {
            id: 1,
            avatarUrl: "https://cdn2.iconfinder.com/data/icons/ios-7-icons/50/user_male2-512.png"
        };
        this.bot = {
            id: 0,
            avatarUrl: "https://pbs.twimg.com/profile_images/1040255354049843200/fGgkKbnW_400x400.jpg"
        };
        this.state = {
            messages: [
                {
                    author: this.bot,
                    text: "Hello Luke, this is RxMx QA Chatbot demo. I've noticed you haven't done blood test since last infusion in May. Should I help you to book a blood test? Here's what I can do:",
                    suggestedActions: [
                        {
                            type: 'initial_question',
                            title: 'Ask Questions'
                        }, {
                            type: 'adverse_event',
                            title: 'Report Adverse Events'
                        },
                        {
                            type: 'test_reservation',
                            title: 'Test Reservation'
                        },
                        {
                            type: 'update_info',
                            title: 'Update Personal Info'
                        },
                    ],
                    timestamp: new Date(),
                }
            ]
        };
        this.addNewMessage = this.addNewMessage.bind(this);
        this.suggestionsBuilder = this.suggestionsBuilder.bind(this);
    }

    onResponse = () => {
        let newMessage = {
            author: this.bot,
            typing: true,
            timestamp: new Date(),
        };
        this.setState((prevState) => {
            return { messages: [...prevState.messages, newMessage] };
        });
    }

    аttachmentTemplate = (props) => {
        let attachment = props.item;
        if (attachment.contentType === "calendar") {
            return <Calendar onChange={(event) => {this.addNewMessage(event);}}/>;
        }
        return <HeroCard title={attachment.title}
        imageUrl={attachment.images ? attachment.images[0].url : ""}
        subtitle={attachment.subtitle ? attachment.subtitle : "" }
        actions={attachment.buttons}
        onActionExecute={this.addNewMessage}/>;
    }

    addNewMessage = async (event) => {
        this.setState((prevState) => ({
            messages: [
                ...prevState.messages,
                event.message
            ]
        }));
        this.onResponse()
        let botResponse = Object.assign({}, event.message);
        let result = await this.sendRequest(event.message.text)
        this.askedQuestions.push(event.message.text)
        this.detailedAnswerFlag = false
        let detailedAnswer = ""
        let sentence_start = 0
        let sentence_end = 0
        let position = 0
        if (result.document) {
            result.document.forEach(function (word) {
                if (word[word.length - 1] === ".") {
                    if (sentence_end !== 0) {
                        sentence_start = sentence_end + 1
                    }
                    sentence_end = position
                    if (result.end <= sentence_end && result.start >= sentence_start) {
                        result.document.slice(sentence_start, sentence_end + 1).forEach(function (word) {
                            detailedAnswer += word + " "
                        })
                    }
                }
                position += 1
            })
            this.detailedAnswerStr = detailedAnswer
        }
        if (result.answer) {
            botResponse.author = this.bot;
            botResponse.text = result.answer.charAt(0).toUpperCase() + result.answer.slice(1)
            botResponse.suggestedActions = []
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    botResponse,
                ]
            }));
            this.suggestionsBuilder()
        } else {
            botResponse.text = result
            botResponse.author = this.bot;
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    botResponse
                ]
            }));
        }
    };

    onAction = (event) => {
        this.setState((prevState) => ({
            messages: [
                ...prevState.messages,
                {
                    author: this.user,
                    text: event.action.title,
                    timestamp: new Date()
                }
            ]
        }));
        if (event.action.type === 'detail') {
            let botResponse = Object.assign({}, event.message);
            botResponse.author = this.bot;
            botResponse.text = event.action.value;
            botResponse.suggestedActions = []
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    botResponse
                ]
            }));
            this.detailedAnswerFlag = true
            this.suggestionsBuilder()
        } else if (event.action.type === 'initial_question') {
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    {
                        author: this.bot,
                        text: "What kind of questions do you have?",
                        suggestedActions: [{
                            type: 'general_question',
                            title: "General Questions"
                        }, {
                            type: 'product_question',
                            title: "Questions of our offerings"
                        }],
                        timestamp: new Date()
                    }
                ]
            }));
        } else if (event.action.type === 'general_question') {
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    {
                        author: this.bot,
                        text: "Here's a few sample questions:",
                        suggestedActions: [{
                            type: 'reply',
                            value: questions.general.speed_of_light
                        }, {
                            type: 'reply',
                            value: questions.general.statue_of_liberty
                        }],
                        timestamp: new Date()
                    }
                ]
            }));
        } else if (event.action.type === 'product_question') {
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    {
                        author: this.bot,
                        text: "Here's a few sample questions:",
                        suggestedActions: [{
                            type: 'reply',
                            value: questions.lemtrada.treatment
                        }, {
                            type: 'reply',
                            value: questions.bloodwatch.definition
                        }],
                        timestamp: new Date()
                    }
                ]
            }));
        } else if (event.action.type === 'adverse_event') {
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    {
                        author: this.bot,
                        text: "Here's a few common side effects. You can select them or describe you own situation:",
                        suggestedActions: [{
                            type: 'reply',
                            value: "Thyroid disorders"
                        }, {
                            type: 'reply',
                            value: "Immune thrombocytopenic purpura"
                        }, {
                            type: 'describe_adverse_event',
                            value: "Describe my adverse event",
                            title: "Describe my adverse event"
                        }],
                        timestamp: new Date()
                    }
                ]
            }));
        } else if (event.action.type === 'describe_adverse_event') {
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    {
                        author: this.bot,
                        text: "Please describe:",
                        timestamp: new Date()
                    }
                ]
            }));
        } else if (event.action.type === 'test_reservation') {
            this.setState((prevState) => ({
                messages: [
                    ...prevState.messages,
                    {
                        author: this.bot,
                        attachments:[{type: "calendar"}],
                        timestamp: new Date()
                    }
                ]
            }));
            this.suggestionsBuilder()
        }
    }

    suggestionsBuilder = () => {
        let splitedString = this.askedQuestions[this.askedQuestions.length - 1].split(" ");
        let keyword = ""
        splitedString.forEach(function (word) {
            switch (word.toLowerCase().replace(/[^A-Za-z]/g, "")) {
                case "lemtrada":
                    keyword = "lemtrada";
                    break;
                case "alemtuzumab":
                    keyword = "lemtrada";
                    break;
                case "bloodwatch":
                    keyword = "bloodwatch";
                    break;
                default:
                    break;
            }
        })
        if (this.detailedAnswerFlag === false && splitedString.length > 1) {
            this.state.messages[this.state.messages.length - 1].suggestedActions.push({ type: 'detail', value: this.detailedAnswerStr, title: 'Detailed Answer' })
        }
        // } else {
        //     this.setState((prevState) => ({
        //         messages: [
        //             ...prevState.messages,
        //             {
        //                 author: this.bot,
        //                 text: "What else do you want to do?",
        //                 suggestedActions: [
        //                     {
        //                         type: 'initial_question',
        //                         title: 'Ask Questions'
        //                     }, {
        //                         type: 'adverse_event',
        //                         title: 'Report Adverse Events'
        //                     }, {
        //                         type: 'test_reservation',
        //                         title: 'Test Reservation'
        //                     }, {
        //                         type: 'update_info',
        //                         title: 'Update Personal Info'
        //                     },
        //                 ],
        //                 timestamp: new Date(),
        //             }
        //         ]
        //     }));
        //     return
        // }
        if (keyword === "lemtrada") {
            for (let question in questions.lemtrada) {
                if (this.askedQuestions.includes(questions.lemtrada[question])) {
                    continue
                }
                console.log(this.state.messages.length)
                this.state.messages[this.state.messages.length - 1].suggestedActions.push({ type: 'reply', value: questions.lemtrada[question] })
            }
        } else if (keyword === "bloodwatch") {
            for (let question in questions.bloodwatch) {
                if (this.askedQuestions.includes(questions.bloodwatch[question])) {
                    continue
                }
                this.state.messages[this.state.messages.length - 1].suggestedActions.push({ type: 'reply', value: questions.bloodwatch[question] })
            }
        }
        this.setState(prevState => {
            return { messages: [...prevState.messages,]};
        });
        console.log(this.state.messages)
    }

    sendRequest = async (question) => {
        this.detailedAnswerFlag = false
        const response = await fetch('http://127.0.0.1:8001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: question }),
        })
        let data = await response.json()
        if (data.result.answer) {
            return data.result
        } else {
            return data.result
        }
    }

    render() {
        return (
            <div>
                <Chat user={this.user}
                    messages={this.state.messages}
                    onMessageSend={this.addNewMessage}
                    placeholder={"Type a message..."}
                    onActionExecute={this.onAction}
                    attachmentTemplate={this.аttachmentTemplate}
                    width={400}>
                </Chat>
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.querySelector('my-app')
);

