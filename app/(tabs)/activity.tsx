i | "success" | "warning" | "error" | "approval" | "rejection";
  is  await activityAPI.signOut();
            setIsSignedIn(false);
            setTodayActivity(null);
            Alert.alert("Success", "Signed out successfully");
            onRefresh();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error.response?.data?.message || "Failed to sign out"
            );
          }
        },
      },
    ]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return { name: "checkmark-circle", color: "#4caf50" };
      case "rejection":
        return { name: "close-circle", color: "#f44336" };
      case "success":
        return { name: "checkmark-circle", color: "#4caf50" };
      case "warning":
        return { name: "warning", color: "#ff9800" };
      case "error":
        return { name: "alert-circle", color: "#f44336" };
      default:
        return { name: "information-circle", color: "#2196F3" };
    }
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd, yyyy");
  };

  const groupNotificationsByDate = () => {
    const filtered =
      filter === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications;

    const grouped = filtered.reduce((acc, notification) => {
      const dateLabel = getDateLabel(notification.created_at);
      const existing = acc.find((section) => section.title === dateLabel);

      if (existing) {
        existing.data.push(notification);
      } else {
        acc.push({ title: dateLabel, data: [notification] });
      }

      return acc;
    }, [] as { title: string; data: Notification[] }[]);

    return grouped;
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.is_read && styles.notificationUnread,
        ]}
        onPress={() => !item.is_read && markAsRead(item.id)}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}
        >
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>
              {format(new Date(item.created_at), "hh:mm a")}
            </Text>
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const sections = groupNotificationsByDate();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Lab Sign-In/Out Section */}
      <View style={styles.signInContainer}>
        {isSignedIn ? (
          <View style={styles.signedInCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
            <View style={styles.signInInfo}>
              <Text style={styles.signInTitle}>Signed In to Lab</Text>
              <Text style={styles.signInTime}>
                Since{" "}
                {todayActivity &&
                  format(new Date(todayActivity.sign_in_time), "hh:mm a")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.signInButton,
              isSigningIn && styles.signInButtonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={24} color="#fff" />
                <Text style={styles.signInButtonText}>Sign In to Lab</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#2196F3" }]}>
            {unreadCount}
          </Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "unread" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("unread")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "unread" && styles.filterTextActive,
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <SectionList
        sections={sections}
        renderItem={renderNotification}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  signInContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#26CCC2",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signedInCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  signInInfo: {
    flex: 1,
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4caf50",
  },
  signInTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#26CCC2",
  },
  signOutButtonText: {
    color: "#26CCC2",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212121",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#26CCC2",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  listContainer: {
    paddingBottom: 16,
  },
  sectionHeader: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
    marginLeft: 8,
    marginTop: 20,
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
    marginTop: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
});
