import React from "react";
import Logo from "../../assets/logo2.png";
import "./Chat_window.css";
import { getChatBot, getChatBotV2, getChatHistory } from "../../api/ApiHook";
import SendIcon from "../../assets/SendIcon";
import BotImage from "../../assets/Bot_img.png";
import { replaceSymbols, setLocalStorage } from "../../lib/utils";
import InfoIcon from "../../assets/InfoIcon";
// import TypingText from "./TypingText";
// import TypingHTML from "./TypingHTML";

const Chat_window = () => {
  const [chat, setChat] = React.useState<any[]>([]);
  const [userQues, setUserQues] = React.useState<string>("");
  const { mutate, isPending, isSuccess } = getChatBot(setChat);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const messagesRef = React.useRef<HTMLDivElement>(null);
  const {
    data: chatHistoryData,
    // isPending: isChatHistoryPending,
    // error: chatHistoryError,
  } = getChatHistory(firstLoad);
  const {
    data: FirstChat,
    // isPending: isFirstChatPending,
    // isSuccess: isFirstChatSuccess,
  } = getChatBotV2();

  const selectOption = async (optionText?: string) => {
    const updatedChat = [...chat];
    const lastChat = updatedChat[updatedChat.length - 1];

    if (optionText) {
      lastChat.response = optionText;
    }

    let selectedOptions: string[] = [];

    if (lastChat.currentQues.qRowOptionList) {
      lastChat.currentQues.qRowOptionList.forEach((option: any) => {
        if (option.checked) {
          selectedOptions.push(option.optionText);
        }
      });
    }

    if (
      lastChat.currentQues.qtype === "multiple-select" &&
      selectedOptions.length === 0
    ) {
      alert("Please select at least one option");
      return;
    }

    const payload = {
      content:
        lastChat.currentQues.qtype === "multiple-select"
          ? selectedOptions.join("&^")
          : lastChat.response,
      status: "continue",
      flag: 0,
    };

    lastChat.loading = true;
    setChat([...updatedChat]);

    mutate(payload);
  };

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scroll({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const userQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userQues.trim()) return;

    const updatedChat = [...chat];
    const lastChat = updatedChat[updatedChat.length - 1];

    if (userQues) {
      lastChat.response = userQues;
    }

    const payload = {
      content: userQues,
      status: "continue",
      flag: 1,
    };

    lastChat.loading = true;

    setChat([...updatedChat]);
    setUserQues("");

    mutate(payload);
  };

  const toggleMultiSelect = (msgIndex: number, optionIndex: number) => {
    const updated = [...chat];

    updated[msgIndex].currentQues.qRowOptionList[optionIndex].checked =
      !updated[msgIndex].currentQues.qRowOptionList[optionIndex].checked;

    setChat(updated);
  };

  React.useEffect(() => {
    if (FirstChat && FirstChat.response && FirstChat.response.length > 0) {
      setChat((pre) => [...pre, ...FirstChat.response]);
      setLocalStorage({
        ID: FirstChat.response[0].ID,
        sessionID: FirstChat.response[0].session_id,
      });
      setFirstLoad(false);
    }
  }, [FirstChat]);

  React.useEffect(() => {
    scrollToBottom();
  }, [chat]);

  React.useEffect(() => {
    if (
      chatHistoryData &&
      chatHistoryData.response &&
      chatHistoryData.response.length > 0
    ) {
      setChat((pre) => [...pre, ...chatHistoryData.response]);
    }
  }, [chatHistoryData]);

  return (
    <div>
      <header className="flex items-center justify-between px-2 py-2 bg-linear-to-t from-primary to-secondary shadow-md">
        <img src={Logo} alt="Chat Bot Image" className="h-12 w-auto" />
        <h1 className="text-2xl font-semibold flex-1 text-center text-white">
          Enspeek Surveys
        </h1>
      </header>
      <main className="chatbot-container container">
        <div className="chat-container">
          <div className="messages_box" ref={messagesRef}>
            {chat.map((msg, i) => {
              return (
                <div key={i}>
                  <div className="bot-message">
                    <img src={BotImage} alt="Bot" className="avatar" />

                    <div className="block">
                      {msg.currentQues?.staticText && (
                        <div className="message-content my-2">
                          {/* <TypingText
                            text={msg.currentQues.staticText}
                            onComplete={() => {
                              setChat((prev) => {
                                const updated = [...prev];

                                updated[i].qtextComplete = true;

                                return updated;
                              });
                            }}
                          /> */}
                          {msg.currentQues.staticText}
                        </div>
                      )}

                      {
                        <div className="message-content">
                          <div
                            className="option_css"
                            dangerouslySetInnerHTML={{
                              __html: msg.currentQues.qtext,
                            }}
                          />
                          {/* <TypingHTML html={msg.currentQues.qtext} /> */}

                          {msg.qtextComplete &&
                            msg.currentQues.qtype === "multiple-select" && (
                              <div className="my-1 italic flex items-center gap-2">
                                <InfoIcon color="#3B82F6" size={20} />

                                <span>
                                  You can use space or comma as a separator
                                  while responding through chatbar.
                                </span>
                              </div>
                            )}

                          <div className="block my-2 _option_box">
                            {msg.currentQues.qRowOptionList?.map(
                              (option: any, optionIndex: any) => {
                                return (
                                  <React.Fragment key={optionIndex}>
                                    {/* SINGLE SELECT */}
                                    {msg.currentQues.qtype ===
                                      "single-select" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          selectOption(option.optionText)
                                        }
                                        className={`option-button px-4 py-1
                                ${option.checked ? "selected-class" : ""}
                                ${
                                  msg.response
                                    ? "highlight-blue disabled-opacity"
                                    : ""
                                }
                              `}
                                        disabled={!!msg.response}
                                      >
                                        {option.optionText}
                                      </button>
                                    )}

                                    {/* MULTIPLE SELECT */}
                                    {msg.currentQues.qtype ===
                                      "multiple-select" &&
                                      msg.disclaimerComplete && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleMultiSelect(i, optionIndex)
                                          }
                                          disabled={i !== chat.length - 1}
                                          className={`option-button px-4 py-1
                                  ${option.checked ? "selected-class" : ""}
                                  ${i !== chat.length - 1 ? "highlight-blue" : ""}
                                  ${msg.response ? "disabled-opacity" : ""}
                                `}
                                        >
                                          <span
                                            dangerouslySetInnerHTML={{
                                              __html: option.optionText,
                                            }}
                                          />
                                        </button>
                                      )}
                                  </React.Fragment>
                                );
                              },
                            )}
                          </div>

                          {msg.currentQues.qtype === "multiple-select" &&
                            msg.disclaimerComplete && (
                              <div className="flex justify-end">
                                <button
                                  // onClick={() => selectOption()}
                                  type="button"
                                  className="btn multi_submit"
                                  title="Click to submit"
                                  disabled={!!msg.response}
                                >
                                  <SendIcon color="#fff" size={20} />
                                </button>
                              </div>
                            )}
                        </div>
                      }
                    </div>
                  </div>

                  {/* USER RESPONSE */}
                  {msg.response && (
                    <div className="user-message">
                      <div className="_bot_response">
                        {msg.currentQues.qtype === "multiple-select"
                          ? replaceSymbols(msg.response)
                          : msg.response}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!isSuccess && isPending && (
              <div className="flex items-start justify-start">
                <div className="_bot_response">
                  <div className="typing">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="form-container">
            <form className="flex" onSubmit={userQuestion}>
              {!chat[chat.length - 1]?.EOS ? (
                <>
                  <input
                    type="text"
                    id="userResInput"
                    className="form-control me-2 userInput inputField"
                    name="text"
                    placeholder="Type your message..."
                    disabled={chat[chat.length - 1]?.EOS}
                    autoFocus
                    value={userQues}
                    onChange={(e) => setUserQues(e.target.value)}
                  />

                  <button
                    type="submit"
                    className="btn"
                    disabled={chat[chat.length - 1]?.EOS}
                  >
                    <SendIcon color="#fff" size={20} />
                  </button>
                </>
              ) : (
                <div
                  className="flex justify-center items-center gap-4 mx-auto bg-gray-200 border border-gray-400 rounded-md p-5 text-gray-800"
                  role="alert"
                >
                  <InfoIcon color="#1e2939" size={20} />
                  The survey has ended. You may now close this window. Thank you
                  for your participation!
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat_window;
