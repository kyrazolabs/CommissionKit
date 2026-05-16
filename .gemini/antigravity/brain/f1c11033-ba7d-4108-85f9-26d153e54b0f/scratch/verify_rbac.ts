import axios from 'axios';

const API_URL = 'http://localhost:8088/api';
const WORKSPACE_ID = '67cc36070624021798369ec9'; // Example workspace ID
const USER_TOKEN = '...'; // I don't have a token, but I can use the local environment if I had one.

// Since I cannot easily run live API tests without a real token/session, 
// I will perform a final code audit of the key security middleware to ensure logic is sound.
