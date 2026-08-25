import api from "./api";

export const getAllContests = async () => {
  return await api.get("/contests");
};

export const getContestById = async (contestId) => {
  return await api.get(`/contests/${contestId}`);
};

export const joinContest = async (contestId) => {
  return await api.post(`/contests/${contestId}/join`);
};

export const getContestStatus = async (contestId) => {
  return await api.get(`/contests/${contestId}/status`);
};

export const getContestProblems = async (contestId) => {
  return await api.get(`/contests/${contestId}/problems`);
};

export const getContestLeaderboard = async (contestId) => {
  return await api.get(`/contests/${contestId}/leaderboard`);
};

export const createContest = async (contestData) => {
  return await api.post("/contests", contestData);
};
