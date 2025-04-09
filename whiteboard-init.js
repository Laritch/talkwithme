// Initialize cursor tracking in webinar.html
document.addEventListener('DOMContentLoaded', () => {
  if (webinarData && socketConnected) {
    // Initialize cursor tracking after whiteboard is initialized
    const cursorTracker = new WhiteboardCursorTracker({
      webinarId: webinarData._id,
      socket: socket,
      isHost: userData._id === webinarData.host,
      isPresenter: webinarData.presenters && webinarData.presenters.some(p => p.user === userData._id)
    });
  }
});
