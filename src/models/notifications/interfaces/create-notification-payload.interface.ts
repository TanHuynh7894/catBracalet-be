export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: string;
  relatedId?: string; 
  userId?: string;    
}