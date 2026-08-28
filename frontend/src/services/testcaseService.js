import api from "./api";

export const getTestCasesByProblem = async (problemId) => {
  const response = await api.get(`/testcases/problem/${problemId}`);
  return response.data;
};

export const createTestCase = async (testCaseData) => {
  const response = await api.post("/testcases", testCaseData);
  return response.data;
};

export const deleteTestCase = async (testCaseId) => {
  const response = await api.delete(`/testcases/${testCaseId}`);
  return response.data;
};
