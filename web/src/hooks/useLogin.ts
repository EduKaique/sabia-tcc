"use client";

import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";

export function useLogin() {
  return useMutation({ mutationFn: login });
}
