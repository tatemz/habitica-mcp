import type { Direction, TaskType } from "./HabiticaSchemas.js";

const taskListTypeParam: Readonly<Record<TaskType, string>> = {
  daily: "dailys",
  habit: "habits",
  reward: "rewards",
  todo: "todos",
};

export const HabiticaRoutes = {
  buySpecialSpell: (key: string): string => `/user/buy-special-spell/${key}`,
  castSkill: (skillKey: string): string => `/user/class/cast/${skillKey}`,
  checklist: (taskId: string): string => `/tasks/${taskId}/checklist`,
  checklistItem: (taskId: string, itemId: string): string => `/tasks/${taskId}/checklist/${itemId}`,
  checklistItemScore: (taskId: string, itemId: string): string =>
    `/tasks/${taskId}/checklist/${itemId}/score`,
  content: (): string => "/content",
  equipMount: (mountKey: string): string => `/user/equip/mount/${mountKey}`,
  equipPet: (petKey: string): string => `/user/equip/pet/${petKey}`,
  feedPet: (petKey: string, foodKey: string): string => `/user/feed/${petKey}/${foodKey}`,
  hatchPet: (eggKey: string, hatchingPotionKey: string): string =>
    `/user/hatch/${eggKey}/${hatchingPotionKey}`,
  inventory: (): string => "/user/inventory",
  market: (): string => "/shops/market",
  notificationRead: (notificationId: string): string => `/notifications/${notificationId}/read`,
  notifications: (): string => "/notifications",
  skillList: (): string => "/user/class/cast",
  tags: (): string => "/tags",
  task: (taskId: string): string => `/tasks/${taskId}`,
  taskScore: (taskId: string, direction: Direction): string =>
    `/tasks/${taskId}/score/${direction}`,
  tasksUser: (): string => "/tasks/user",
  user: (): string => "/user",
};

export const taskListUrlParams = (
  type: TaskType | undefined,
): Readonly<Record<string, string>> | undefined =>
  type === undefined ? undefined : { type: taskListTypeParam[type] };
