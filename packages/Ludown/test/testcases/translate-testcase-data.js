module.exports.tests = {
    'phraseList': {
        'luFile': `$ChocolateType:phraseList
    - m&m,mars,mints,spearmings,payday,jelly,kit kat,kitkat,twix
$question:PhraseList interchangeable
    - are you
    - you are`,
        'langCode': 'de',
        'translatedContent': `$ChocolateType:phraseList
- m&m, Mars, Mints, spearmings, Zahltag, Gelee, Kit Kat, KitKat, Twix
$question:PhraseList interchangeable
- Bist du
- Du bist
`
    },
    'allEntities': {
        'luFile': `$userName:simple
$PREBUILT:datetimeV2
$PREBUILT:age
$PREBUILT:dimension
$PREBUILT:email
$PREBUILT:money
$PREBUILT:number
$PREBUILT:ordinal
$PREBUILT:percentage
$PREBUILT:phoneNumber
$PREBUILT:temperature
$PREBUILT:url
$commPreference:call=
- phone call
- give me a ring
- ring
- call
- cell phone
- phone`,
        'langCode':'de',
        'translatedContent': `$userName:simple
$PREBUILT:datetimeV2
$PREBUILT:age
$PREBUILT:dimension
$PREBUILT:email
$PREBUILT:money
$PREBUILT:number
$PREBUILT:ordinal
$PREBUILT:percentage
$PREBUILT:phoneNumber
$PREBUILT:temperature
$PREBUILT:url
$commPreference:call=
- Telefonat
- Gib mir einen Ring
- Ring
- Aufrufen
- Handy
- Telefon
`
    },
    'intentsAndUtterances': {
        'luFile': `> Doing everything as a pattern
        # AskForUserName
        - {userName}
        - I'm {userName}
        - call me {userName}`,
        'langCode': 'fr',
        'translatedContent':`> Faire tout comme un modèle
# AskForUserName
- userName
- Je suis {userName}
- Appelez-moi {userName d'utilisateur}
`
    },
    'intentsAndUtterancesNC': {
        'luFile': `> Doing everything as a pattern
        # AskForUserName
        - {userName}
        - I'm {userName}
        - call me {userName}`,
        'langCode': 'fr',
        'translatedContent':`> Doing everything as a pattern
# AskForUserName
- userName
- Je suis {userName}
- Appelez-moi {userName d'utilisateur}
`
    },
    'qna': {
        'luFile': `### ? How do I change the default message
        `,
        'langCode': 'de',
        'translatedContent': `### ? Wie ändere ich die Standardmeldung

`
    },
    'fileRef': {
        'luFile': `[Sweet](https://docs.microsoft.com/en-in/azure/cognitive-services/qnamaker/faqs)
`,
        'langCode': 'de',
        'translatedContent': `[Süß](https://docs.microsoft.com/en-in/azure/cognitive-services/qnamaker/faqs)
`
    },
    'badLu': {
        'luFile': `? foo bar`,
        'langCode': 'de'
    },
    'labelledEntityValue': {
        'luFile': `# Greeting
        - hi {time = morning}
        `,
        'langCode': 'de',
        'translatedContent': `# Greeting
- HI {time=Morning}

`
    }
};
