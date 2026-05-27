import React from "react";
import "./Chat_window.css";
import { getChatBot, getChatBotV2, getChatHistory } from "../../api/ApiHook";
import { replaceSymbols, setLocalStorage } from "../../lib/utils";
import { BadgeCheck, Info, LoaderCircle, SendHorizontal } from "lucide-react";
// import TypingText from "./TypingText";
// import TypingHTML from "./TypingHTML";

const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-indicator-inner">
        <div className="typing-indicator-content">
          <span className="typing-indicator-text">Thinking</span>
          <span className="copying-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const Chat_window = () => {
  const [chat, setChat] = React.useState<any[]>([]);
  const [userQues, setUserQues] = React.useState<string>("");
  const { mutate, isPending, isSuccess } = getChatBot(setChat, chat);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const messagesRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {
    data: chatHistoryData,
    isFetching: isChatHistoryFetching,
    // error: chatHistoryError,
  } = getChatHistory(firstLoad);
  const {
    data: FirstChat,
    isFetching: isFirstChatFetching,
    // isSuccess: isFirstChatSuccess,
  } = getChatBotV2();

  const isChatbarDisabled =
    isPending ||
    isFirstChatFetching ||
    isChatHistoryFetching ||
    !!chat[chat.length - 1]?.EOS;

  const isApiPending = isPending || isFirstChatFetching || isChatHistoryFetching;

  const showThinking =
    isPending || (chat.length === 0 && (isFirstChatFetching || isChatHistoryFetching));

  const isSurveyEnded = !!chat[chat.length - 1]?.EOS;

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
    if (!isChatbarDisabled) {
      inputRef.current?.focus();
    }
  }, [isChatbarDisabled]);

  React.useEffect(() => {
    const focusChatInput = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key !== "/") return;
      if (isChatbarDisabled) return;

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", focusChatInput);

    return () => {
      window.removeEventListener("keydown", focusChatInput);
    };
  }, [isChatbarDisabled]);

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
      <main className="chatbot-container container">
        <div className="pr-[10px]">
          <div className="chatbot-theme-strip" aria-hidden="true" />
        </div>
        {isSurveyEnded ? (
          <section className="survey-complete-view" aria-live="polite">
            <div className="survey-complete-card">
              <div className="survey-complete-logo">
                <BadgeCheck size={30} strokeWidth={2.5} />
              </div>
              <h1 className="survey-complete-heading">Survey Session Ended</h1>
              <p className="survey-complete-message">
                The survey has ended. You may now close this window. Thank you for your participation!
              </p>
            </div>
          </section>
        ) : (
        <div className="chat-container">
          <div className="messages_box" ref={messagesRef}>
            {chat.map((msg, i) => {
              return (
                <div key={i}>
                  <div className="bot-message">
                    <div className="avatar-label bot-avatar mt-2" aria-label="AI">
                      AI
                    </div>

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
                        <div className="message-content mt-2">
                          <div
                            className="option_css"
                            dangerouslySetInnerHTML={{
                              __html: msg.currentQues.qtext,
                            }}
                          />
                          {/* <TypingHTML html={msg.currentQues.qtext} /> */}

                          {msg.currentQues.qtype === "multiple-select" && (
                              <div className="my-1 italic flex items-center gap-2">
                                <Info color="var(--color-core-info)" size={20} />

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
                                      "multiple-select" && (
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
                            i === chat.length - 1 &&
                            !msg.response && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => selectOption()}
                                  type="button"
                                  className="btn multi_submit"
                                  title="Click to submit"
                                  disabled={!!msg.response}
                                >
                                  <SendHorizontal color="var(--color-core-text-inverse)" size={20} />
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
                      <div className="avatar-label user-avatar" aria-label="You">
                        You
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!isSuccess && showThinking && (
              <TypingIndicator />
            )}
          </div>
          <div className="form-container">
            <form className="chat-input-form" onSubmit={userQuestion}>
              <>
                <input
                  type="text"
                  id="userResInput"
                  className="form-control me-2 userInput inputField"
                  name="text"
                  placeholder="Type you mesage..."
                  disabled={isChatbarDisabled}
                  autoFocus
                  autoComplete="off"
                  ref={inputRef}
                  value={userQues}
                  onChange={(e) => setUserQues(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn chat-send-button"
                  disabled={isChatbarDisabled}
                  title="Send message"
                  aria-label="Send message"
                >
                  {isApiPending ? (
                    <LoaderCircle
                      color="var(--color-core-text-inverse)"
                      size={20}
                      className="spinner-icon"
                    />
                  ) : (
                    <SendHorizontal color="var(--color-core-text-inverse)" size={20} />
                  )}
                </button>
              </>
            </form>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default Chat_window;
