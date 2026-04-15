import { z } from "zod";

export const createAccountSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  labelNames: z.array(z.string()).optional().default([]),
});

export const updateAccountSchema = z.object({
  // No fields needed for now — account is a container
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.number().int().positive()),
});

export const createAddressSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
});

export const updateAddressSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确").optional(),
  addLabelNames: z.array(z.string()).optional(),
  removeLabelIds: z.array(z.number().int().positive()).optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, "标签名称不能为空").max(50),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1, "标签名称不能为空").max(50),
});
