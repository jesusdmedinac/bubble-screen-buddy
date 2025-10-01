import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export type NotificationType = 
  | "challenge_completed"
  | "xp_gained"
  | "level_up"
  | "streak_milestone"
  | "reward_claimed"
  | "reward_used"
  | "achievement_unlocked";

export interface AchievementNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export const useAchievementNotifications = () => {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  
  // Function to show a toast notification for achievements
  const showAchievementNotification = (type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>) => {
    // Show the toast notification
    toast({
      title,
      description: message,
      duration: 5000,
    });
    
    // Add to notifications list
    const newNotification: AchievementNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      metadata,
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep only last 20 notifications
    
    return newNotification.id;
  };

  // Specific functions for different types of notifications
  const notifyChallengeCompleted = (challengeTitle: string, xpGained: number) => {
    return showAchievementNotification(
      "challenge_completed",
      "¡Desafío completado!",
      `Completaste "${challengeTitle}" y ganaste ${xpGained} XP`,
      { challengeTitle, xpGained }
    );
  };

  const notifyXPGained = (amount: number, reason: string) => {
    return showAchievementNotification(
      "xp_gained",
      "¡XP ganado!",
      `Ganaste ${amount} XP ${reason ? `por ${reason}` : ''}`,
      { amount, reason }
    );
  };

  const notifyLevelUp = (newLevel: number, totalXP: number) => {
    return showAchievementNotification(
      "level_up",
      "¡Subiste de nivel!",
      `Has alcanzado el nivel ${newLevel} con ${totalXP} XP totales`,
      { newLevel, totalXP }
    );
  };

  const notifyStreakMilestone = (streakDays: number) => {
    return showAchievementNotification(
      "streak_milestone",
      "¡Racha increíble!",
      `Has mantenido una racha de ${streakDays} días consecutivos`,
      { streakDays }
    );
  };

  const notifyRewardClaimed = (rewardTitle: string) => {
    return showAchievementNotification(
      "reward_claimed",
      "¡Recompensa canjeada!",
      `Has canjeado "${rewardTitle}"`,
      { rewardTitle }
    );
  };

  const notifyRewardUsed = (rewardTitle: string) => {
    return showAchievementNotification(
      "reward_used",
      "¡Recompensa usada!",
      `Has utilizado "${rewardTitle}"`,
      { rewardTitle }
    );
  };

  const notifyAchievementUnlocked = (achievementName: string, description: string) => {
    return showAchievementNotification(
      "achievement_unlocked",
      "¡Logro desbloqueado!",
      `${achievementName}: ${description}`,
      { achievementName, description }
    );
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    notifyChallengeCompleted,
    notifyXPGained,
    notifyLevelUp,
    notifyStreakMilestone,
    notifyRewardClaimed,
    notifyRewardUsed,
    notifyAchievementUnlocked,
    showAchievementNotification,
  };
};