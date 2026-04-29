export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/students/me',
  },
  courses: {
    list: '/courses',
    detail: (id: number) => `/courses/${id}`,
    lessons: (courseId: number) => `/lessons/course/${courseId}`,
  },
  enrollments: {
    byStudent: (studentId: number) => `/enrollments/student/${studentId}`,
    create: '/enrollments',
  },
  progress: {
    me: '/progress/me',
    update: (lessonId: number) => `/progress/${lessonId}`,
  },
  sessions: {
    me: '/sessions/me',
    create: '/sessions',
  },
};
