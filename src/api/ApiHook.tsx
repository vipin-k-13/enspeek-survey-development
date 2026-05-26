import { useLocation, useSearchParams } from "react-router";
import { getLocalStorage } from "../lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "../service/apiService";
import url from "./url";

export const getChatHistory = (first: boolean) => {
  const [searchParams] = useSearchParams();
  let masterData = getLocalStorage();
  const studyId = searchParams.get("gear");
  //   const token = searchParams.get("token");
  const surveyId = searchParams.get("zone");

  if (!masterData) {
    masterData = { sessionID: "" };
  }

  const { data, isPending, error } = useQuery({
    queryKey: ["chat_history"],
    queryFn: async () => {
      const res = await apiRequest("post", url.chatbot_history.url, {
        sessionID: masterData["sessionID"],
        apiToken: masterData["token"],
        surveyID: surveyId,
        processID: studyId,
        ID: masterData["ID"],
      });

      return res.response;
    },
    refetchOnWindowFocus: false,
    enabled: !!masterData["sessionID"] && first,
  });

  return { data, isPending, error };
};

export const getChatBot = (SetChat: (data: any) => void) => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  let masterData = getLocalStorage();
  const studyId = searchParams.get("gear");
  //   const token = searchParams.get("token");
  const surveyId = searchParams.get("zone");

  const { mutate, isPending, data, error, isSuccess } = useMutation({
    mutationKey: ["chatbotv3"],
    mutationFn: async (payload: any) => {
      const res = await apiRequest("post", url.chatbotv3.url, {
        content: payload.content,
        status: payload.status,
        flag: payload.flag,
        sessionID: masterData["sessionID"],
        apiToken: masterData["token"],
        surveyID: surveyId,
        processID: studyId,
        ID: masterData["ID"],
        preCode: [],
      });

      return res.response;
    },
    onSuccess: (data: any) => {
      if (data && data.response && data.response.length > 0) {
        SetChat((prev: any) => {
          const updatedChat = [...prev];

          const lastChat = updatedChat[updatedChat.length - 1];

          const previousQuestion = data.response[0]?.prevQues;

          if (previousQuestion && lastChat?.currentQues?.qRowOptionList) {
            lastChat.currentQues.qRowOptionList =
              lastChat.currentQues.qRowOptionList.map((option: any) => ({
                ...option,
                checked: previousQuestion.option_id.includes(option.optionID),
              }));
          }

          lastChat.submitted = true;
          lastChat.loading = false;

          return [...updatedChat, data.response[0]];
        });
      }
    },
  });

  return { mutate, isPending, data, error, isSuccess };
};

export const getChatBotV2 = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  let masterData = getLocalStorage();
  const studyId = searchParams.get("gear");
  //   const token = searchParams.get("token");
  const ID = searchParams.get("ID");
  const surveyId = searchParams.get("zone");

  const { data, isPending, isSuccess } = useQuery({
    queryKey: ["chatbotv2"],
    queryFn: async () => {
      const res = await apiRequest("post", url.chatbotv3.url, {
        content: "",
        status: "",
        flag: 0,
        sessionID: masterData["sessionID"],
        apiToken: masterData["token"],
        surveyID: surveyId,
        processID: studyId,
        ID: ID,
        preCode: [],
      });

      return res.response;
    },
    retry: 1,
    enabled: !masterData["sessionID"],
    refetchOnWindowFocus: false,
  });

  return { data, isPending, isSuccess };
};
