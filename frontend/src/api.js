import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // change if your backend runs elsewhere
  timeout: 5000
});

export function setAuthToken(token){
  if(token) {
    API.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    localStorage.setItem('mc_token', token);
  } else {
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem('mc_token');
  }
}

export function getSavedToken(){
  return localStorage.getItem('mc_token');
}

export default API;
