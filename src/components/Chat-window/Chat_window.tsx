import React from "react";
import "./Chat_window.css";
import { getChatBot, getChatBotV2, getChatHistory } from "../../api/ApiHook";
import { replaceSymbols, setLocalStorage } from "../../lib/utils";
import { Check, Info, LoaderCircle, SendHorizontal } from "lucide-react";

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
  const [multiSelectErrors, setMultiSelectErrors] = React.useState<
    Record<number, boolean>
  >({});
  const { mutate, isPending, isSuccess } = getChatBot(setChat, chat);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const messagesRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const submissionInFlightRef = React.useRef(false);
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
    chat.length === 0 ||
    !!chat[chat.length - 1]?.EOS;

  const isApiPending = isPending || isFirstChatFetching || isChatHistoryFetching;

  const showThinking =
    isPending ||
    (chat.length === 0 && (isFirstChatFetching || isChatHistoryFetching));

  const isSurveyEnded = !!chat[chat.length - 1]?.EOS;

  const submitPayload = (payload: {
    content: string;
    status: string;
    flag: number;
  }) => {
    submissionInFlightRef.current = true;
    mutate(payload, {
      onSettled: () => {
        submissionInFlightRef.current = false;
      },
    });
  };

  const selectOption = (optionText?: string) => {
    if (isApiPending || submissionInFlightRef.current) return;

    const updatedChat = [...chat];
    const lastChat = updatedChat[updatedChat.length - 1];
    if (!lastChat?.currentQues) return;

    if (optionText) {
      lastChat.response = optionText;
    }

    const selectedOptions: string[] = [];

    if (lastChat.currentQues.qRowOptionList) {
      lastChat.currentQues.qRowOptionList.forEach((option: any) => {
        if (option.checked) {
          selectedOptions.push(option.optionText);
        }
      });
    }

    if (
      lastChat.currentQues?.qtype === "multiple-select" &&
      selectedOptions.length === 0
    ) {
      setMultiSelectErrors((prev) => ({
        ...prev,
        [updatedChat.length - 1]: true,
      }));
      return;
    }

    const payload = {
      content:
        lastChat.currentQues?.qtype === "multiple-select"
          ? selectedOptions.join("&^")
          : lastChat.response,
      status: "continue",
      flag: 0,
    };

    lastChat.loading = true;
    setChat([...updatedChat]);

    submitPayload(payload);
  };

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scroll({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const submitUserQuestion = () => {
    if (isChatbarDisabled || submissionInFlightRef.current || !userQues.trim())
      return;

    const updatedChat = [...chat];
    const lastChat = updatedChat[updatedChat.length - 1];
    if (!lastChat) return;
    const currentIndex = updatedChat.length - 1;

    if (userQues) {
      lastChat.response = userQues;
    }
    setMultiSelectErrors((prev) => ({
      ...prev,
      [currentIndex]: false,
    }));

    const payload = {
      content: userQues,
      status: "continue",
      flag: 1,
    };

    lastChat.loading = true;

    setChat([...updatedChat]);
    setUserQues("");

    submitPayload(payload);
  };

  const userQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    submitUserQuestion();
  };

  const handleChatInputKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;

    e.preventDefault();
    submitUserQuestion();
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserQues(e.target.value);
  };

  const toggleMultiSelect = (msgIndex: number, optionIndex: number) => {
    if (isApiPending || submissionInFlightRef.current) return;

    const optionList = chat[msgIndex]?.currentQues?.qRowOptionList;
    if (!optionList?.[optionIndex]) return;

    const hasCheckedOption = optionList.some((option: any, optionIdx: number) =>
      optionIdx === optionIndex ? !option.checked : option.checked,
    );

    setChat((prevChat) =>
      prevChat.map((msg, i) => {
        if (i !== msgIndex) return msg;

        const currentOptionList = msg.currentQues?.qRowOptionList;
        if (!currentOptionList?.[optionIndex]) return msg;

        return {
          ...msg,
          currentQues: {
            ...msg.currentQues,
            qRowOptionList: currentOptionList.map(
              (option: any, optionIdx: number) =>
                optionIdx === optionIndex
                  ? { ...option, checked: !option.checked }
                  : option,
            ),
          },
        };
      }),
    );

    if (hasCheckedOption) {
      setMultiSelectErrors((prev) => ({
        ...prev,
        [msgIndex]: false,
      }));
    }
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
    const frame = requestAnimationFrame(scrollToBottom);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [chat, showThinking, isApiPending]);

  React.useEffect(() => {
    if (!isChatbarDisabled) {
      inputRef.current?.focus();
    }
  }, [isChatbarDisabled]);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
  }, [userQues]);

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
      setChat((pre) => [
        ...pre,
        ...chatHistoryData.response.map((previousChat: any) => ({
          ...previousChat,
          fromHistory: true,
        })),
      ]);
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
                <Check size={46} strokeWidth={4} />
              </div>
              <h1 className="survey-complete-heading">
                Survey Submitted Successfully
              </h1>
              <p className="survey-complete-message">
                Thank you for your participation. You may now close this window!
              </p>
            </div>
          </section>
        ) : (
          <div className="chat-container">
            <div className="messages_box" ref={messagesRef}>
              {chat.map((msg, i) => {
                const isAnsweredQuestion = !!msg.response || !!msg.submitted;
                const isQuestionDisabled = isAnsweredQuestion || isApiPending;

                return (
                  <div key={i}>
                    <div className="bot-message">
                      <div className="block">
                        {msg.currentQues?.staticText && (
                          <div className="message-content my-2">
                            {msg.currentQues.staticText}
                          </div>
                        )}

                        <div className="message-content mt-2">
                          <div
                            className="option_css"
                            dangerouslySetInnerHTML={{
                              __html: msg.currentQues?.qtext,
                            }}
                          />

                          {msg.currentQues?.qtype === "multiple-select" && (
                            <div className="my-1 italic flex items-center gap-2">
                              <Info color="var(--color-core-info)" size={20} />

                              <span>
                                You can use space or comma as a separator while
                                responding through chatbar.
                              </span>
                            </div>
                          )}

                          {!!msg.currentQues?.qRowOptionList?.length && (
                            <div className="block my-2 _option_box">
                              {msg.currentQues.qRowOptionList.map(
                                (option: any, optionIndex: any) => {
                                  return (
                                    <React.Fragment key={optionIndex}>
                                      {/* SINGLE SELECT */}
                                      {msg.currentQues?.qtype ===
                                        "single-select" && (
                                        <label
                                          className={`option-choice
                                            ${
                                              msg.response === option.optionText
                                                ? "selected-class"
                                                : ""
                                            }
                                            ${
                                              isQuestionDisabled
                                                ? "disabled-opacity"
                                                : ""
                                            }
                                          `}
                                        >
                                          <input
                                            type="radio"
                                            name={`single-select-${i}`}
                                            checked={
                                              msg.response === option.optionText
                                            }
                                            disabled={isQuestionDisabled}
                                            onChange={() =>
                                              selectOption(option.optionText)
                                            }
                                          />
                                          <span
                                            className="option-label"
                                            dangerouslySetInnerHTML={{
                                              __html: option.optionText,
                                            }}
                                          />
                                        </label>
                                      )}

                                      {/* MULTIPLE SELECT */}
                                      {msg.currentQues?.qtype ===
                                        "multiple-select" && (
                                        <label
                                          className={`option-choice
                                            ${
                                              option.checked
                                                ? "selected-class"
                                                : ""
                                            }
                                            ${
                                              isQuestionDisabled
                                                ? "disabled-opacity"
                                                : ""
                                            }
                                          `}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={!!option.checked}
                                            disabled={
                                              i !== chat.length - 1 ||
                                              isQuestionDisabled
                                            }
                                            onChange={() =>
                                              toggleMultiSelect(i, optionIndex)
                                            }
                                          />
                                          <span
                                            className="option-label"
                                            dangerouslySetInnerHTML={{
                                              __html: option.optionText,
                                            }}
                                          />
                                        </label>
                                      )}
                                    </React.Fragment>
                                  );
                                },
                              )}
                            </div>
                          )}

                          {msg.currentQues?.qtype === "multiple-select" &&
                            i === chat.length - 1 &&
                            !msg.response && (
                              <div className="multi-submit-row">
                                {multiSelectErrors[i] && (
                                  <span className="multi-select-error">
                                    Please select at least one option.
                                  </span>
                                )}
                                <button
                                  onClick={() => selectOption()}
                                  type="button"
                                  className="btn multi_submit"
                                  title="Click to submit"
                                  disabled={isQuestionDisabled}
                                >
                                  <SendHorizontal
                                    color="var(--color-core-text-inverse)"
                                    size={20}
                                  />
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* USER RESPONSE */}
                    {msg.response && (
                      <div className="user-message mt-5">
                        <div className="_bot_response">
                          {msg.currentQues?.qtype === "multiple-select"
                            ? replaceSymbols(msg.response)
                            : msg.response}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!isSuccess && showThinking && <TypingIndicator />}
            </div>
            <div className="form-container">
              <form
                className="survey-chatbar-shell platform-chat-shell chat-input-form"
                onSubmit={userQuestion}
              >
                <textarea
                  id="userResInput"
                  className="survey-chatbar-input home-text home-chat-placeholder userInput inputField"
                  name="text"
                  placeholder="Type your answer..."
                  title="Type your answer..."
                  aria-label="Type your answer..."
                  disabled={isChatbarDisabled}
                  autoFocus
                  autoComplete="off"
                  ref={inputRef}
                  value={userQues}
                  onChange={handleChatInputChange}
                  onKeyDown={handleChatInputKeyDown}
                  rows={1}
                />

                <button
                  type="submit"
                  className="survey-chatbar-send platform-chat-send chat-send-button"
                  disabled={isChatbarDisabled}
                  title="Send message"
                  aria-label="Send message"
                >
                  {isApiPending ? (
                    <LoaderCircle
                      color="var(--color-core-text-inverse)"
                      size={20}
                      className="survey-chatbar-send-icon spinner-icon"
                    />
                  ) : (
                    <SendHorizontal
                      color="var(--color-core-text-inverse)"
                      size={20}
                      className="survey-chatbar-send-icon"
                    />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat_window;
