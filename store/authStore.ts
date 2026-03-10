import { create } from "zustand";
import { authAPI, setToken, removeToken } from "@/lib/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface User {
  id: number;
  name: string;
  email: string;
