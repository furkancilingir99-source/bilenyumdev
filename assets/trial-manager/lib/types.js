/**
 * @file Domain type definitions (JSDoc) — Online ücretsiz deneme dersi yönetim paneli
 */
(function (global) {
  'use strict';

  /**
   * @typedef {'Matematik'|'Fen'} LessonTypeName
   */

  /**
   * @typedef {Object} LessonType
   * @property {string} id
   * @property {LessonTypeName} name
   * @property {20} defaultCapacity
   * @property {50} defaultDurationMinutes
   * @property {20} parentPresentationMinutes
   * @property {30} studentTrialMinutes
   * @property {boolean} isActive
   */

  /**
   * @typedef {'new_request'|'awaiting_assignment'|'scheduled'|'confirmed'|'attended'|'no_show'|'enrolled'|'cancelled'|'lost'} StudentStatus
   */

  /**
   * @typedef {'admin_panel'|'trial_lesson_application'} DataSource
   */

  /**
   * @typedef {'branch'|'pdr'} TeacherType
   */

  /**
   * @typedef {Object} Student
   * @property {string} id
   * @property {DataSource} [source]
   * @property {string} [applicationRequestId]
   * @property {string} firstName
   * @property {string} lastName
   * @property {number} age
   * @property {string} grade
   * @property {string} level
   * @property {string} requestedLessonTypeId
   * @property {string[]} parentIds
   * @property {StudentStatus} status
   * @property {string[]} hasUsedFreeTrialForLessonTypeIds
   * @property {string} [notes]
   * @property {string} createdAt
   * @property {string} updatedAt
   */

  /**
   * @typedef {'phone'|'whatsapp'|'sms'|'email'} CommunicationPreference
   */

  /**
   * @typedef {Object} ParentGuardian
   * @property {string} id
   * @property {DataSource} [source]
   * @property {string} firstName
   * @property {string} lastName
   * @property {string} phone
   * @property {string} email
   * @property {string[]} studentIds
   * @property {CommunicationPreference[]} preferredChannels
   * @property {string} [notes]
   * @property {string} createdAt
   * @property {string} updatedAt
   */

  /**
   * @typedef {Object} TeacherAvailability
   * @property {string} id
   * @property {string} teacherId
   * @property {0|1|2|3|4|5|6} dayOfWeek
   * @property {string} startTime
   * @property {string} endTime
   * @property {boolean} isAvailable
   * @property {string} [note]
   */

  /**
   * @typedef {Object} Teacher
   * @property {string} id
   * @property {DataSource} [source]
   * @property {TeacherType} [teacherType]
   * @property {string} [trialLessonNotes]
   * @property {string} [informedNote]
   * @property {string} firstName
   * @property {string} lastName
   * @property {string} phone
   * @property {string} email
   * @property {string[]} branchLessonTypeIds
   * @property {TeacherAvailability[]} availability
   * @property {boolean} dashboardEnabled
   * @property {boolean} isActive
   * @property {string} [notes]
   */

  /**
   * @typedef {'active'|'inactive'|'cancelled'|'expired'} OnlineMeetingStatus
   */

  /**
   * @typedef {Object} OnlineMeeting
   * @property {string} id
   * @property {string} sessionId
   * @property {'internal_app'} platform
   * @property {string} meetingUrl
   * @property {string} meetingId
   * @property {string} passcode
   * @property {OnlineMeetingStatus} status
   * @property {string} generatedAt
   * @property {string} updatedAt
   * @property {string} [lastPasscodeChangedAt]
   */

  /**
   * @typedef {'draft'|'scheduled'|'confirmed'|'completed'|'cancelled'|'rescheduled'} TrialLessonSessionStatus
   */

  /**
   * @typedef {Object} TrialLessonSession
   * @property {string} id
   * @property {string} title
   * @property {string} lessonTypeId
   * @property {string} branchTeacherId
   * @property {string} pdrTeacherId
   * @property {string} date
   * @property {string} startTime
   * @property {string} endTime
   * @property {20} capacity
   * @property {string[]} enrolledStudentIds
   * @property {string[]} reservationIds
   * @property {string} onlineMeetingId
   * @property {TrialLessonSessionStatus} status
   * @property {20} parentPresentationMinutes
   * @property {30} studentTrialMinutes
   * @property {boolean} pdrTeacherInformed
   * @property {string} [pdrTeacherInformedAt]
   * @property {string} [pdrTeacherInformedByUserId]
   * @property {boolean} branchTeacherInformed
   * @property {string} [branchTeacherInformedAt]
   * @property {string} [branchTeacherInformedByUserId]
   * @property {string} [notes]
   * @property {string} createdByUserId
   * @property {string} createdAt
   * @property {string} updatedAt
   */

  /**
   * @typedef {'new'|'reviewing'|'assigned'|'rejected'|'cancelled'} TrialLessonRequestStatus
   */

  /**
   * @typedef {Object} TrialLessonRequest
   * @property {string} id
   * @property {string} studentFirstName
   * @property {string} studentLastName
   * @property {number} studentAge
   * @property {string} studentGrade
   * @property {string} studentLevel
   * @property {string} requestedLessonTypeId
   * @property {string} parentFirstName
   * @property {string} parentLastName
   * @property {string} parentPhone
   * @property {string} parentEmail
   * @property {string} [selectedSessionId]
   * @property {TrialLessonRequestStatus} status
   * @property {'website_form'} source
   * @property {string} createdAt
   * @property {string} updatedAt
   */

  /**
   * @typedef {'pending'|'confirmed'|'cancelled'|'rescheduled'|'attended'|'no_show'} ReservationStatus
   */

  /**
   * @typedef {'not_called'|'unreachable'|'approved'|'rejected'|'call_again'} ParentApprovalStatus
   */

  /**
   * @typedef {Object} TrialLessonReservation
   * @property {string} id
   * @property {string} [requestId]
   * @property {string} studentId
   * @property {string} parentId
   * @property {string} sessionId
   * @property {string} lessonTypeId
   * @property {ReservationStatus} status
   * @property {ParentApprovalStatus} parentApprovalStatus
   * @property {boolean} linkSent
   * @property {string} [linkSentAt]
   * @property {string} [linkSentByUserId]
   * @property {boolean} teacherInformed
   * @property {string} [teacherInformedAt]
   * @property {string} [teacherInformedByUserId]
   * @property {string} [changeReason]
   * @property {string} [cancellationReason]
   * @property {string[]} communicationLogIds
   * @property {string} [notes]
   * @property {boolean} [enrolled]
   * @property {string} createdAt
   * @property {string} updatedAt
   */

  /**
   * @typedef {'phone'|'whatsapp'|'sms'|'email'} CommunicationChannel
   */

  /**
   * @typedef {'not_called'|'unreachable'|'approved'|'rejected'|'call_again'|'message_sent'|'teacher_informed'|'link_sent'} CommunicationResult
   */

  /**
   * @typedef {Object} CommunicationLog
   * @property {string} id
   * @property {string} [studentId]
   * @property {string} [parentId]
   * @property {string} [teacherId]
   * @property {string} [reservationId]
   * @property {string} [sessionId]
   * @property {CommunicationChannel} channel
   * @property {CommunicationResult} result
   * @property {string} summary
   * @property {string} [nextAction]
   * @property {string} [nextActionDate]
   * @property {string} createdByUserId
   * @property {string} createdAt
   */

  /**
   * @typedef {Object} AuditLog
   * @property {string} id
   * @property {'student'|'parent'|'teacher'|'trial_lesson_request'|'reservation'|'trial_lesson_session'|'online_meeting'} entityType
   * @property {string} entityId
   * @property {string} action
   * @property {string} description
   * @property {string} [reason]
   * @property {*} [previousValue]
   * @property {*} [newValue]
   * @property {string} createdByUserId
   * @property {string} createdAt
   */

  /**
   * @typedef {'super_admin'|'trial_lesson_manager'|'viewer'} UserRole
   */

  /**
   * @typedef {Object} AdminUser
   * @property {string} id
   * @property {string} firstName
   * @property {string} lastName
   * @property {string} email
   * @property {UserRole} role
   * @property {boolean} canView
   * @property {boolean} canCreate
   * @property {boolean} canEdit
   * @property {boolean} canCancel
   * @property {boolean} canExport
   * @property {boolean} isActive
   */

  global.TMTypes = {};
})(typeof window !== 'undefined' ? window : this);
