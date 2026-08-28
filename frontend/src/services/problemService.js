import api from "./api";

export const getProblems = async (params) => {
  const response = await api.get("/problems", { params });
  return response.data;
};

export const getProblemById = async (id) => {
  const response = await api.get(`/problems/${id}`);
  return response.data;
};

export const createProblem = async (data) => {
  const response = await api.post("/problems", data);
  return response.data;
};

export const updateProblem = async (id, data) => {
  const response = await api.put(`/problems/${id}`, data);
  return response.data;
};

export const deleteProblem = async (id) => {
  const response = await api.delete(`/problems/${id}`);
  return response.data;
};
