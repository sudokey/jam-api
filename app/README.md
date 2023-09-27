/code (email)
    get code in redis

    if code
        get date of code

        if date > 2 min
            create new code
            save new code in redis
            send new code to user email
        else
            throw send seconds to wait
    else
        create code
        save code in redis
        send code to user email

/token (email, code)
    get code in redis

    if code
        check code
            if ok
                get or create user
                remove code
                add user logined
                create token with user id
                send token

----------------------------------------------

if !user.logined - invalid token

token.created < user.logined - invalid token

token.created >= user.logined - valid token

---------------------------------------------

code.mail@test.com = 1qw3qw42.1695285806632
session.1 = 1695285806632

email max length validation
