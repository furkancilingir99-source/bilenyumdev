var modelValue = {
    users: {
        text: 'lang:/user',
        sub: {
            role: {
                inputType: 'select',
                text: 'lang:/role',
                placeholder: 'lang:/role',
                value: {
                    teacher: {
                        text: 'lang:/teacher'
                    },
                    student: {
                        text: 'lang:/student'
                    },
                    admin: {
                        text: 'lang:/admin'
                    },
                    parent: {
                        text: 'lang:/parent'
                    },
                    trialclassManager: {
                        text: 'lang:/trialclassManager'
                    }
                },
                src: 'key'
            },
            email: {
                text: 'lang:/email',
                placeholder: 'lang:/exampleEmail',
                syntax: {
                    value: '^\\S+@\\S+\\.\\S+$'
                }
            },
            pass: {
                text: 'lang:/pass',
                placeholder: '●●●●●●●●',
                required: true,
                display: 'none',
                authorization: {
                    get: {
                        allow: {}
                    }
                }
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        fields: {
                            '#k': 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        fields: {
                            '#k': 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    clients: {
        text: 'lang:/client',
        sub: {
            image: {
                inputType: 'image',
                text: 'lang:/image'
            },
            first: {
                text: 'lang:/firstName',
                placeholder: 'lang:/enterFirstName',
                required: true
            },
            last: {
                text: 'lang:/lastName',
                placeholder: 'lang:/enterLastName',
                required: true
            },
            classroomKey: {
                text: 'lang:/classroom',
                placeholder: 'lang:/classroom',
                display: 'inTable',
                required: true
            },
            parentKey: {
                text: 'lang:/parent',
                placeholder: 'lang:/parent',
                display: 'inTable'
            },
            childKey: {
                text: 'lang:/child',
                placeholder: 'lang:/child',
                display: 'inTable'
            },
            teacherKeys: {
                text: 'lang:/teachers',
                display: 'none'
            },
            gender: {
                inputType: 'select',
                text: 'lang:/gender',
                placeholder: 'lang:/gender',
                value: {
                    man: {
                        text: 'lang:/man'
                    },
                    woman: {
                        text: 'lang:/woman'
                    }
                },
                src: 'key',
                required: true
            },
            grade: {
                text: 'lang:/grade',
                inputType: 'select',
                value: {
                    5: {
                        text: '5'
                    },
                    6: {
                        text: '6'
                    },
                    7: {
                        text: '7'
                    },
                    8: {
                        text: '8'
                    }
                },
                required: true
            },
            parentFirst: {
                text: 'lang:/first',
                placeholder: 'lang:/enterFirstName',
                required: true
            },
            parentLast: {
                text: 'lang:/last',
                placeholder: 'lang:/enterLastName',
                required: true
            },
            parentEmail: {
                text: 'lang:/email',
                placeholder: 'lang:/exampleEmail',
                syntax: {
                    value: '^\\S+@\\S+\\.\\S+$'
                },
                required: true
            },
            parentPhone: {
                text: 'lang:/phone',
                placeholder: 'lang:/examplePhone',
                inputType: 'phone',
                required: true
            },
            communicationPreference: {
                inputType: 'select',
                text: 'lang:/communicationPreference',
                placeholder: 'lang:/communicationPreference',
                value: {
                    email: {
                        text: 'lang:/email'
                    },
                    call: {
                        text: 'lang:/call'
                    },
                    sms: {
                        text: 'lang:/sms'
                    }
                },
                src: 'key',
                required: true
            },
            schoolType: {
                inputType: 'select',
                text: 'lang:/schoolType',
                placeholder: 'lang:/schoolType',
                value: {
                    government: {
                        text: 'lang:/government'
                    },
                    special: {
                        text: 'lang:/special'
                    }
                },
                src: 'key',
                required: true
            },
            province: {
                inputType: 'select',
                text: 'lang:/province',
                placeholder: 'lang:/province',
                value: 'def:/provinces',
                src: 'key',
                required: true
            },
            district: {
                inputType: 'select',
                text: 'lang:/district',
                placeholder: 'lang:/district',
                value: 'def:/districts',
                src: 'key',
                required: true
            },
            school: {
                inputType: 'select',
                text: 'lang:/school',
                placeholder: 'lang:/school',
                value: 'def:/schools',
                src: 'key',
                required: true
            },
            packageKey: {
                text: 'lang:/package',
                display: 'inTable',
                required: true
            },
            planKey: {
                text: 'lang:/plan',
                display: 'inTable',
                required: true
            },
            level: {
                text: 'lang:/level',
                inputType: 'number'
            },
            notificationSetting: {
                text: 'lang:/notificationSettings',
                sub: {
                    messages: {
                        inputType: 'boolean',
                        text: 'lang:/messages',
                        roles: {
                            0: 'student',
                            1: 'teacher',
                            2: 'parent'
                        }
                    },
                    tasks: {
                        inputType: 'boolean',
                        text: 'lang:/tasks',
                        roles: {
                            0: 'student',
                            1: 'parent'
                        }
                    },
                    exams: {
                        inputType: 'boolean',
                        text: 'lang:/exams',
                        roles: {
                            0: 'student',
                            1: 'parent',
                            2: 'teacher',
                        }
                    },
                    absentMeetings: { // todo
                        inputType: 'boolean',
                        text: 'lang:/absentMeetings',
                        roles: {
                            0: 'student',
                            1: 'parent'
                        }
                    },
                    changeStudentRanking: {
                        inputType: 'boolean',
                        text: 'lang:/changeStudentRanking',
                        roles: {
                            0: 'student',
                            1: 'parent'
                        }
                    },
                    changeClassRanking: {
                        inputType: 'boolean',
                        text: 'lang:/changeClassRanking',
                        roles: {
                            0: 'student',
                            1: 'parent',
                            2: 'teacher'
                        }
                    }
                }
            },
            permissions: {
                sub: {
                    sms: {
                        inputType: 'boolean',
                        text: 'lang:/sms'
                    },
                    call: {
                        inputType: 'boolean',
                        text: 'lang:/call'
                    },
                    email: {
                        inputType: 'boolean',
                        text: 'lang:/email'
                    }
                },
                display: 'none'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        fields: {
                            '#k': 'userKey'
                        }
                    },
                    1: {
                        fields: {
                            parentKey: 'userKey'
                        }
                    },
                    2: {
                        fields: {
                            teacherKeys: 'userKey'
                        }
                    },
                    3: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        fields: {
                            '#k': 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    models: {
        text: 'lang:/models',
        authorization: {
            get: {
                allow: 'public'
            }
        }
    },
    notifications: {
        text: 'lang:/notification',
        sub: {
            type: {
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    message: {
                        text: 'lang:/message'
                    },
                    task: {
                        text: 'lang:/task'
                    },
                    exam: {
                        text: 'lang:/exam'
                    },
                    absentMeeting: {
                        text: 'lang:/absentMeeting'
                    },
                    changeStudentRanking: {
                        text: 'lang:/changeStudentRanking'
                    },
                    changeClassRanking: {
                        text: 'lang:/changeClassRanking'
                    }
                },
                src: 'key',
                required: true
            },
            body: {
                text: 'lang:/body',
                required: true
            },
            assignedTo: {
                text: 'lang:/assignedTo',
                display: 'inTable',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            get: {
                allow: {
                    0: {
                        fields: {
                            assignedTo: 'userKey'
                        }
                    }
                }
            }
        }
    },
    videos: {
        text: 'lang:/video',
        sub: {
            value: {
                text: 'lang:/video',
                fields: {
                    text: 'lang:/fields',
                    type: 'virtual',
                    sub: {
                        width: {
                            text: 'lang:/width'
                        },
                        height: {
                            text: 'lang:/height'
                        },
                        duration: {
                            inputType: 'number',
                            text: 'lang:/duration'
                        },
                        'binary-dot-mp4': {
                            inputType: 'file'
                        }
                    }
                },
                required: true
            },
            title: {
                inputType: 'title',
                text: 'lang:/title',
                required: true
            },
            description: {
                text: 'lang:/description',
                inputType: 'longText',
                placeholder: 'lang:/description'
            },
            classroomKey: {
                text: 'lang:/classroom',
                required: true
            },
            planKey: {
                text: 'lang:/plan',
                required: true
            },
            meetingKey: {
                text: 'lang:/meeting',
                required: true
            },
            lessonKey: {
                text: 'lang:/lesson',
                required: true
            },
            type: {
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    manual: {
                        text: 'lang:/manual'
                    },
                    meeting: {
                        text: 'lang:/meeting'
                    }
                },
                src: 'key',
                display: 'none',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    packages: {
        text: 'lang:/package',
        sub: {
            image: {
                inputType: 'image',
                text: 'lang:/image',
                required: true
            },
            title: {
                inputType: 'title',
                text: 'lang:/title',
                required: true
            },
            description: {
                text: 'lang:/description',
                inputType: 'longText'
            },
            grade: {
                text: 'lang:/grade',
                required: true
            },
            options: {
                text: 'lang:/options',
                sub: {
                    content: {
                        text: 'lang:/content',
                        inputType: 'longText'
                    }
                }
            },
            features: {
                text: 'lang:/features',
                sub: {
                    image: {
                        inputType: 'image',
                        text: 'lang:/image',
                        required: true
                    },
                    title: {
                        text: 'lang:/title',
                        required: true
                    },
                    description: {
                        text: 'lang:/description',
                        inputType: 'longText'
                    }
                }
            },
            popularity: {
                inputType: 'boolean',
                text: 'lang:/popularity'
            },
            studentNumber: {
                text: 'lang:/studentNumber',
                inputType: 'number',
                required: true
            },
            startsAt: {
                inputType: 'dateTime',
                text: 'lang:/startsAt',
                required: true
            },
            endsAt: {
                inputType: 'dateTime',
                text: 'lang:/endsAt',
                required: true
            },
            installment: {
                text: 'lang:/installment',
                inputType: 'number'
            },
            price: {
                text: 'lang:/price',
                sub: {
                    value: {
                        inputType: 'number',
                        text: 'lang:/value',
                        required: true
                    },
                    currency: {
                        inputType: 'select',
                        text: 'lang:/currency',
                        value: {
                            try: {
                                text: 'lang:/try',
                                sign: '₺'
                            }
                        },
                        default: 'try',
                        src: 'key',
                        required: true
                    },
                    vat: {
                        inputType: 'number',
                        text: 'lang:/vat'
                    },
                    total: {
                        inputType: 'number',
                        text: 'lang:/total',
                        required: true
                    }
                }
            },
            planKey: {
                text: 'lang:/plan',
                display: 'inTable',
                required: true
            },
            videoKey: {
                text: 'lang:/video',
                display: 'inTable',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    plans: {
        text: 'lang:/plan',
        sub: {
            title: {
                inputType: 'title',
                text: 'lang:/title',
                required: true
            },
            description: {
                text: 'lang:/description',
                inputType: 'longText'
            },
            grade: {
                text: 'lang:/grade',
                required: true
            },
            startsAt: {
                inputType: 'dateTime',
                text: 'lang:/startsAt',
                required: true
            },
            endsAt: {
                inputType: 'dateTime',
                text: 'lang:/endsAt',
                required: true
            },
            meetings: {
                text: 'lang:/meetings',
                sub: {
                    title: {
                        text: 'lang:/title',
                        required: true
                    },
                    description: {
                        text: 'lang:/description',
                        inputType: 'longText',
                        required: true
                    },
                    startsAt: {
                        inputType: 'dateTime',
                        text: 'lang:/startsAt',
                        required: true
                    },
                    endsAt: {
                        inputType: 'dateTime',
                        text: 'lang:/endsAt',
                        required: true
                    },
                    lessonKey: {
                        text: 'lang:/lesson',
                        required: true
                    },
                    topic: {
                        inputType: 'select',
                        text: 'lang:/topic',
                        placeholder: 'lang:/topic',
                        value: 'def:/topics',
                        src: 'key',
                        required: true
                    },
                    subTopic: {
                        inputType: 'select',
                        text: 'lang:/subTopic',
                        placeholder: 'lang:/subTopic',
                        value: 'def:/subTopics',
                        src: 'key',
                        required: true
                    }
                },
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    meetings: {
        text: 'lang:/meetings',
        sub: {
            title: {
                text: 'lang:/title',
                required: true
            },
            description: {
                text: 'lang:/description',
                inputType: 'longText',
                required: true
            },
            planKey: {
                text: 'lang:/plan',
                required: true
            },
            grade: {
                text: 'lang:/grade',
                required: true
            },
            classroomKey: {
                text: 'lang:/classroom',
                required: true
            },
            startsAt: {
                inputType: 'dateTime',
                text: 'lang:/startsAt',
                required: true
            },
            endsAt: {
                inputType: 'dateTime',
                text: 'lang:/endsAt',
                required: true
            },
            lessonKey: {
                text: 'lang:/lesson',
                required: true
            },
            topic: {
                inputType: 'select',
                text: 'lang:/topic',
                placeholder: 'lang:/topic',
                value: 'def:/topics',
                src: 'key',
                required: true
            },
            subTopic: {
                inputType: 'select',
                text: 'lang:/subTopic',
                placeholder: 'lang:/subTopic',
                value: 'def:/subTopics',
                src: 'key',
                required: true
            }
        },
        required: true
    },
    classrooms: {
        text: 'lang:/classroom',
        sub: {
            image: {
                inputType: 'image',
                text: 'lang:/image'
            },
            name: {
                text: 'lang:/image',
                required: true
            },
            startsAt: {
                inputType: 'dateTime',
                text: 'lang:/startsAt',
                required: true
            },
            endsAt: {
                inputType: 'dateTime',
                text: 'lang:/endsAt',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    teammates: {
        text: 'lang:/teammate',
        sub: {
            image: {
                inputType: 'image',
                text: 'lang:/image'
            },
            first: {
                text: 'lang:/firstName',
                required: true,
                placeholder: 'lang:/enterFirstName'
            },
            last: {
                text: 'lang:/lastName',
                required: true,
                placeholder: 'lang:/enterLastName'
            },
            bio: {
                text: 'lang:/bio',
                inputType: 'longText'
            },
            slogan: {
                text: 'lang:/slogan',
                inputType: 'longText'
            },
            roleCategory: {
                inputType: 'select',
                text: 'lang:/roleCategory',
                value: 'def:/roleCategories',
                src: 'key',
                required: true
            },
            roleSubcategory: {
                inputType: 'select',
                text: 'lang:/roleSubcategory',
                value: 'def:/roleSubcategories',
                src: 'key',
                required: true
            },
            linkedin: {
                text: 'lang:/linkedin'
            },
            email: {
                text: 'lang:/email'
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    questions: {
        text: 'lang:/question',
        sub: {
            image: {
                inputType: 'image',
                text: 'lang:/image',
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            content: {
                inputType: 'longText',
                text: 'lang:/content',
                required: true,
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            options: {
                text: 'lang:/options',
                sub: {
                    content: {
                        text: 'lang:/content',
                        inputType: 'longText',
                        required: true
                    }
                },
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            reply: {
                text: 'lang:/reply',
                inputType: 'number'
            },
            videoSolvingReply: {
                text: 'lang:/video',
                display: 'inForm',
                fields: {
                    text: 'lang:/fields',
                    type: 'virtual',
                    sub: {
                        width: {
                            text: 'lang:/width'
                        },
                        height: {
                            text: 'lang:/height'
                        },
                        duration: {
                            inputType: 'number',
                            text: 'lang:/duration'
                        },
                        'binary-dot-mp4': {
                            inputType: 'file'
                        }
                    }
                }
            },
            lessonKey: {
                text: 'lang:/lesson',
                required: true
            },
            grade: {
                text: 'lang:/grade',
                inputType: 'number',
                required: true
            },
            difficulty: {
                inputType: 'select',
                text: 'lang:/difficulty',
                placeholder: 'lang:/difficulty',
                value: {
                    0: {
                        text: '1'
                    },
                    1: {
                        text: '2'
                    },
                    2: {
                        text: '3'
                    },
                    3: {
                        text: '4'
                    },
                    4: {
                        text: '5'
                    }
                },
                src: 'key',
                required: true
            },
            point: {
                inputType: 'number',
                text: 'lang:/point',
                placeholder: 'lang:/point',
                required: true
            },
            type: { // todo
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    kid: { // Kavram İnşa Dersi
                        text: 'lang:/kid'
                    },
                    rud: { // Rehberli Uygulama Dersi
                        text: 'lang:/rud'
                    }
                },
                src: 'key',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable',
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable',
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'teacher'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    exams: {
        text: 'lang:/exam',
        sub: {
            title: {
                text: 'lang:/title',
                required: true,
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            description: {
                inputType: 'longText',
                text: 'lang:/description',
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            verbalStartsAt: {
                inputType: 'dateTime',
                text: 'lang:/verbalStartsAt',
                required: true,
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            verbalEndsAt: {
                inputType: 'dateTime',
                text: 'lang:/verbalEndsAt',
                required: true,
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            numericalStartsAt: {
                inputType: 'dateTime',
                text: 'lang:/numericalStartsAt',
                required: true,
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            numericalEndsAt: {
                inputType: 'dateTime',
                text: 'lang:/numericalEndsAt',
                required: true,
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            questionKeys: {
                text: 'lang:/questions'
            },
            type: {
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    evaluation: {
                        text: 'lang:/evaluation'
                    },
                    placement: {
                        text: 'lang:/placement'
                    }
                },
                src: 'key',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable',
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable',
                authorization: {
                    get: {
                        allow: 'public'
                    }
                }
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'teacher'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    tasks: {
        text: 'lang:/task',
        sub: {
            title: {
                text: 'lang:/title',
                required: true
            },
            description: {
                inputType: 'longText',
                text: 'lang:/description'
            },
            startsAt: {
                inputType: 'dateTime',
                text: 'lang:/startsAt',
                required: true
            },
            endsAt: {
                inputType: 'dateTime',
                text: 'lang:/endsAt',
                required: true
            },
            lessonKey: {
                text: 'lang:/lesson'
            },
            questionKeys: {
                text: 'lang:/questions'
            },
            grade: {
                text: 'lang:/grade',
                inputType: 'number'
            },
            questions: {
                text: 'lang:/questions',
                sub: {
                    image: {
                        inputType: 'image',
                        text: 'lang:/image',
                        authorization: {
                            get: {
                                allow: 'public'
                            }
                        }
                    },
                    content: {
                        inputType: 'longText',
                        text: 'lang:/content',
                        required: true,
                        authorization: {
                            get: {
                                allow: 'public'
                            }
                        }
                    },
                    options: {
                        text: 'lang:/options',
                        sub: {
                            content: {
                                text: 'lang:/content',
                                inputType: 'longText',
                                required: true
                            }
                        },
                        authorization: {
                            get: {
                                allow: 'public'
                            }
                        }
                    },
                    reply: {
                        text: 'lang:/reply'
                    },
                    replies: {
                        text: 'lang:/replies'
                    },
                    difficulty: {
                        inputType: 'select',
                        text: 'lang:/difficulty',
                        placeholder: 'lang:/difficulty',
                        value: {
                            0: {
                                text: '1'
                            },
                            1: {
                                text: '2'
                            },
                            2: {
                                text: '3'
                            },
                            3: {
                                text: '4'
                            },
                            4: {
                                text: '5'
                            }
                        },
                        src: 'key',
                        required: true
                    },
                    type: {
                        inputType: 'select',
                        text: 'lang:/type',
                        value: {
                            select: {
                                text: 'lang:/select'
                            },
                            multiSelect: {
                                text: 'lang:/multiSelect'
                            }
                        },
                        src: 'key',
                        required: true
                    },
                    createdAt: {
                        inputType: 'dateTime',
                        text: 'lang:/createdAt',
                        display: 'inTable',
                        authorization: {
                            get: {
                                allow: 'public'
                            }
                        }
                    },
                    createdBy: {
                        text: 'lang:/createdBy',
                        display: 'inTable',
                        authorization: {
                            get: {
                                allow: 'public'
                            }
                        }
                    }
                }
            },
            type: {
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    kid: { // Kavram İnşa Dersi
                        text: 'lang:/kid'
                    },
                    rud: { // Rehberli Uygulama Dersi
                        text: 'lang:/rud'
                    },
                    monthlySBS: { // Seviye Belirleme Sınavı, Level Evalution Exam
                        text: 'lang:/monthlySBS'
                    },
                    placementSBS: {
                        text: 'lang:/placementSBS'
                    },
                    placementFocusingTest: {
                        text: 'lang:/placementFocusingTest'
                    }
                },
                src: 'key',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    answers: {
        text: 'lang:/answer',
        sub: {
            questionKey: {
                text: 'lang:/question',
                display: 'inTable',
                required: true
            },
            examKey: {
                text: 'lang:/exam',
                display: 'inTable'
            },
            taskKey: {
                text: 'lang:/task',
                display: 'inTable'
            },
            type: {
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    exam: {
                        text: 'lang:/exam'
                    },
                    task: {
                        text: 'lang:/task'
                    }
                },
                src: 'key',
                required: true
            },
            reply: {
                text: 'lang:/reply',
                inputType: 'number'
            },
            replies: {
                text: 'lang:/replies'
            },
            startsAt: {
                inputType: 'dateTime',
                text: 'lang:/startsAt',
                required: true
            },
            endsAt: {
                inputType: 'dateTime',
                text: 'lang:/endsAt',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'student'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        fields: {
                            createdBy: 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        fields: {
                            createdBy: 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    lessons: {
        text: 'lang:/lesson',
        sub: {
            name: {
                text: 'lang:/name',
                required: true
            },
            type: {
                text: 'lang:/type',
                inputType: 'select',
                value: {
                    verbal: {
                        text: 'lang:/verbal'
                    },
                    numerical: {
                        text: 'lang:/numerical'
                    }
                },
                src: 'key',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    feedbacks: {
        text: 'lang:/feedback',
        sub: {
            video: {
                text: 'lang:/video',
                display: 'inForm',
                fields: {
                    text: 'lang:/fields',
                    type: 'virtual',
                    sub: {
                        width: {
                            text: 'lang:/width'
                        },
                        height: {
                            text: 'lang:/height'
                        },
                        duration: {
                            inputType: 'number',
                            text: 'lang:/duration'
                        },
                        'binary-dot-mp4': {
                            inputType: 'file'
                        }
                    }
                }
            },
            cover: {
                inputType: 'image',
                text: 'lang:/cover',
                required: true,
            },
            title: {
                text: 'lang:/title',
                required: true
            },
            clientKey: {
                text: 'lang:/clientKey'
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    faqs: {
        text: 'lang:/faqs',
        sub: {
            question: {
                text: 'lang:/question',
                required: true
            },
            questionType: {
                text: 'lang:/questionType',
                inputType: 'select',
                value: {
                    purchase: {
                        text: 'lang:/purchase'
                    },
                    platform: {
                        text: 'lang:/platform'
                    },
                    parentalControlCenter: {
                        text: 'lang:/parentalControlCenter'
                    },
                    studentControlCenter: {
                        text: 'lang:/studentControlCenter'
                    },
                    educationalContents: {
                        text: 'lang:/educationalContents'
                    }
                },
                src: 'key'
            },
            reply: {
                text: 'lang:/reply',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: 'public'
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    participants: {
        text: 'lang:/participant',
        sub: {
            lessonKey: {
                text: 'lang:/lesson',
                display: 'inTable',
                required: true
            },
            classroomKey: {
                text: 'lang:/classroom',
                display: 'inTable',
                required: true
            },
            meetingKey: {
                text: 'lang:/meeting',
                display: 'inTable',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'student'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'teacher'
                        }
                    },
                    2: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        fields: {
                            createdBy: 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'teacher'
                        }
                    },
                    2: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        fields: {
                            createdBy: 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    points: {
        text: 'lang:/point',
        sub: {
            taskKey: {
                text: 'lang:/task'
            },
            examKey: {
                text: 'lang:/exam'
            },
            meetingKey: {
                text: 'lang:/meeting'
            },
            classroomKey: {
                text: 'lang:/classroom'
            },
            type: {
                inputType: 'select',
                text: 'lang:/type',
                value: {
                    exam: {
                        text: 'lang:/exam'
                    },
                    task: {
                        text: 'lang:/task'
                    },
                    meeting: {
                        text: 'lang:/meeting'
                    },
                    raise: {
                        text: 'lang:/raise'
                    },
                    workingOnBlackboard: {
                        text: 'lang:/workingOnBlackboard'
                    },
                    trueAnswer: {
                        text: 'lang:/trueAnswer'
                    }
                },
                src: 'key',
                required: true
            },
            value: {
                inputType: 'number',
                text: 'lang:/value',
                required: true
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            get: {
                allow: {
                    0: {
                        fields: {
                            createdBy: 'userKey'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    }
                }
            }
        }
    },
    requests: {
        text: 'lang:/request',
        sub: {
            first: {
                text: 'lang:/first',
                placeholder: 'lang:/enterFirstName',
                required: true
            },
            last: {
                text: 'lang:/last',
                placeholder: 'lang:/enterLastName',
                required: true
            },
            grade: {
                text: 'lang:/grade',
                inputType: 'number',
                required: true
            },
            lessonKey: { // math or science
                text: 'lang:/lesson',
                inputType: 'select',
                required: true
            },
            parentFirst: {
                text: 'lang:/first',
                placeholder: 'lang:/enterFirstName',
                required: true
            },
            parentLast: {
                text: 'lang:/last',
                placeholder: 'lang:/enterLastName',
                required: true
            },
            email: {
                text: 'lang:/email',
                placeholder: 'lang:/exampleEmail',
                syntax: {
                    value: '^\\S+@\\S+\\.\\S+$'
                },
                required: true
            },
            phone: {
                text: 'lang:/phone',
                placeholder: 'lang:/examplePhone',
                inputType: 'phone',
                required: true
            },
            meetingKey: {
                text: 'lang:/meeting',
                required: true
            },
            planKey: {
                text: 'lang:/plan',
                required: true
            },
            captcha: {
                inputType: 'captcha',
                text: 'lang:/captcha',
                display: 'inForm',
                required: true
            },
            status: {
                inputType: 'select',
                text: 'lang:/status',
                value: {
                    accepted: {
                        text: 'lang:/accepted'
                    },
                    rejected: {
                        text: 'lang:/rejected'
                    },
                    pending: {
                        text: 'lang:/pending'
                    }
                },
                src: 'key'
            },
            createdAt: {
                inputType: 'dateTime',
                text: 'lang:/createdAt',
                display: 'inTable'
            },
            createdBy: {
                text: 'lang:/createdBy',
                display: 'inTable'
            }
        },
        authorization: {
            push: {
                allow: 'public'
            },
            get: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'trialclassManager'
                        }
                    }
                }
            },
            set: {
                allow: {
                    0: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'admin'
                        }
                    },
                    1: {
                        userKey: {
                            func: 'join',
                            path: '/users',
                            fieldKey: 'role',
                            equalTo: 'trialclassManager'
                        }
                    }
                }
            }
        }
    }
};