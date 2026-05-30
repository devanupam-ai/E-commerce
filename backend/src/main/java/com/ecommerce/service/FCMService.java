package com.ecommerce.service;

import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service @Slf4j
public class FCMService {

    public void sendNotification(String fcmToken, String title, String body, Long referenceId) {
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putData("referenceId", String.valueOf(referenceId))
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (Exception e) {
            log.error("FCM send failed: {}", e.getMessage());
        }
    }
}
