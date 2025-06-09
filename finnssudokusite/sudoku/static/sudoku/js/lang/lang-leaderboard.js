var translations = {
    langLeaderboard: {
        en: "Leaderboard",
        de: "Bestenliste",
        jp: "リーダーボード" // リーダーボード (rīdābōdo): Lehnwort aus dem Englischen "Leaderboard", bezeichnet Ranglisten in Spielen.
    },
    langHeadline: {
        en: "For a detailed explanation of how the rating is computed,",
        de: "Für eine ausführliche Erklärung, wie die Bewertung berechnet wird,",
        jp: "評価の計算方法について詳しく知りたい方は、" // 評価の計算方法について詳しく知りたい方は (hyōka no keisan hōhō ni tsuite kuwashiku shiritai kata wa): "Wenn Sie mehr über die Bewertungsberechnung wissen möchten,"
    },
    langClick: {
        en: "click here",
        de: "hier klicken",
        jp: "こちらをクリック" // こちらをクリック (kochira o kurikku): "Hier klicken"
    },
    langRank: {
        en: "Rank",
        de: "Rang",
        jp: "順位" // 順位 (jun'i): "Rang" oder "Platzierung"
    },
    langUser: {
        en: "User",
        de: "Benutzer",
        jp: "ユーザー" // ユーザー (yūzā): Lehnwort aus dem Englischen "User", gebräuchlich für Benutzer
    },
    langScore: {
        en: "Total Score",
        de: "Punkte",
        jp: "合計スコア" // 合計スコア (gōkei sukoa): "Gesamtpunktzahl" (Score)
    },
    langSolved: {
        en: "Puzzles Solved",
        de: "Gelöste Rätsel",
        jp: "解いたパズル数" // 解いたパズル数 (toita pazuru-sū): "Anzahl gelöster Puzzles"
    },
    langModalTitle: {
        en: "How Is Your Rating Calculated?",
        de: "Wie wird deine Bewertung berechnet?",
        jp: "あなたの評価はどのように計算されますか？" // あなたの評価はどのように計算されますか？ (anata no hyōka wa dono yō ni keisan saremasu ka?): "Wie wird Ihre Bewertung berechnet?"
    },
    langModalLine2: {
        en: 'The leaderboard uses the <strong>Sudoku Power Index (SPI)</strong> &mdash; a 0‑100 score that rewards <em>fast</em> solves on <em>hard</em> puzzles, values <em>recency</em>, and gives a gentle boost for tackling lots of puzzles.',
        de: 'Die Bestenliste verwendet den <strong>Sudoku Power Index (SPI)</strong> &mdash; eine 0‑100-Punktzahl, die <em>schnelle</em> Lösungen bei <em>schwierigen</em> Rätseln belohnt, <em>Aktualität</em> berücksichtigt und Vielspieler leicht bevorzugt.',
        jp: 'リーダーボードは<strong>数独パワー指数（SPI）</strong>を使用しています。これは、<em>難しい</em>パズルを<em>速く</em>解くこと、<em>最近の実績</em>、そして多くのパズルに挑戦することを評価する0～100のスコアです。'
        // リーダーボードは数独パワー指数（SPI）を使用しています...(rīdābōdo wa sūdoku pawā shisū (SPI) o shiyō shiteimasu...): "Die Bestenliste verwendet den Sudoku Power Index (SPI)..."
    },
    langModalPoint1: {
        en: "Per‑puzzle points",
        de: "Punkte pro Rätsel",
        jp: "パズルごとのポイント" // パズルごとのポイント (pazuru goto no pointo): "Punkte pro gelöstem Puzzle"
    },
    langModalPont1Info: {
        en: "Each time you solve a puzzle you earn:",
        de: "Jedes Mal, wenn du ein Rätsel löst, erhältst du:",
        jp: "パズルを解くたびに獲得します" // パズルを解くたびに獲得します (pazuru o toku tabi ni kakutoku shimasu): "Du erhältst jedes Mal, wenn du ein Puzzle löst"
    },
    langModalPoint1Recency: {
        en: "Recency",
        de: "Aktualität",
        jp: "最近の実績" // 最近の実績 (saikin no jisseki): "Neueste Leistung/Aktualität"
    },
    langModalPoint1Difficulty: {
        en: "Difficulty",
        de: "Schwierigkeit",
        jp: "難易度" // 難易度 (nan'ido): "Schwierigkeitsgrad"
    },
    langModalPoint1SpeedBonus: {
        en: "Speed bonus",
        de: "Geschwindigkeitsbonus",
        jp: "スピードボーナス" // スピードボーナス (supīdo bōnasu): "Speed-Bonus"
    },
    langModalNotation: {
        en: "Notation:",
        de: "Notation:",
        jp: "表記：" // 表記 (hyōki): "Notation/Schreibweise"
    },
    langModalTotal: {
        en: "total solves",
        de: "Gesamtanzahl gelöst",
        jp: "総クリア数" // 総クリア数 (sō kuria-sū): "Gesamtanzahl der gelösten Puzzles"
    },
    langModalAttempts: {
        en: "attempts on the puzzle",
        de: "Versuche für das Rätsel",
        jp: "パズルへの挑戦回数" // パズルへの挑戦回数 (pazuru e no chōsen kaisū): "Anzahl der Versuche für das Puzzle"
    },
    langModalAverage: {
        en: "average solve time",
        de: "durchschnittliche Lösungszeit",
        jp: "平均クリア時間" // 平均クリア時間 (heikin kuria jikan): "durchschnittliche Zeit zum Lösen"
    },
    langModalTime: {
        en: "your time",
        de: "deine Zeit",
        jp: "あなたのタイム" // あなたのタイム (anata no taimu): "deine Zeit"
    },
    langModal60Day: {
        en: "(60‑day half‑life)",
        de: "(Halbwertszeit: 60 Tage)",
        jp: "（60日間の半減期）" // 60日間の半減期 (rokujuu nichi kan no hangeki): "Halbwertszeit von 60 Tagen"
    },

    landModalPoint2: {
        en: "Cumulative strength<br>Your lifetime strength grows with the <em>recency‑weighted</em> sums",
        de: "<strong>2.&nbsp;Kumulative Stärke</strong><br>Deine Gesamtstärke wächst mit den <em>aktualitätsgewichteten</em> Summen",
        jp: "<strong>2.&nbsp;累積ストレングス</strong><br>あなたの生涯ストレングスは<em>最近の実績重視</em>の合計で増加します"
        // 累積ストレングス (ruiseki sutorengusu): "kumulative Stärke", 最近の実績重視 (saikin no jisseki jūshi): "rezente Gewichtung"
    },
    langModalVolume: {
        en: "volume",
        de: "Anzahl",
        jp: "ボリューム" // ボリューム (borūmu): Lehnwort "Volume", steht hier für "Menge/Anzahl"
    },

    langModalPoint3: {
        en: "<strong>3.&nbsp;Raw rating</strong><br>frequent players get a modest boost.",
        de: "<strong>3.&nbsp;Rohbewertung</strong><br>Häufige Spieler erhalten einen kleinen Bonus.",
        jp: "<strong>3.&nbsp;生の評価</strong><br>頻繁にプレイする人には少しボーナスがあります。"
        // 生の評価 (nama no hyōka): "Rohbewertung"; 頻繁にプレイする人には少しボーナスがあります (hinpan ni purei suru hito ni wa sukoshi bōnasu ga arimasu): "Häufige Spieler bekommen einen kleinen Bonus."
    },
    langModalPoint4: {
        en: "<strong>4.&nbsp;Leaderboard score</strong><br>Everyone is placed on a 0‑100 scale:",
        de: "<strong>4.&nbsp;Bestenlisten-Score</strong><br>Alle werden auf einer 0‑100-Skala eingeordnet:",
        jp: "<strong>4.&nbsp;リーダーボードスコア</strong><br>全員が0〜100のスケールで配置されます："
        // リーダーボードスコア (rīdābōdo sukoa): "Leaderboard-Score", 全員が0〜100のスケールで配置されます (zen'in ga zero kara hyaku no sukēru de haichi saremasu): "Alle werden auf einer 0-100 Skala eingeordnet"
    },
    langModalPoint4Text: {
        en: "so the current number‑one player always shows <strong>100</strong>.",
        de: "sodass der aktuelle Erstplatzierte immer <strong>100</strong> angezeigt bekommt.",
        jp: "そのため、現在の1位のプレイヤーは常に<strong>100</strong>と表示されます。"
        // そのため、現在の1位のプレイヤーは常に100と表示されます (sono tame, genzai no ichi-i no pureiyā wa tsuneni 100 to hyōji saremasu): "Deshalb wird dem aktuellen Erstplatzierten immer 100 angezeigt."
    },
    langModalWhy: {
        en: "Why exponential decay?",
        de: "Warum ein exponentieller Abfall?",
        jp: "なぜ指数関数的な減衰なのか？" // なぜ指数関数的な減衰なのか？ (naze shisū kansū-teki na gensui na no ka?): "Warum exponentielle Abnahme?"
    },
    langModalWhyAns: {
        en: "It keeps the board dynamic: a stellar run <em>today</em> can lift you quickly, but you need to keep performing to stay on top.<br>After 60 days, a solve counts for only half its original value.",
        de: "So bleibt die Bestenliste dynamisch: Eine starke Leistung <em>heute</em> bringt dich schnell nach oben, aber du musst dranbleiben, um oben zu bleiben.<br>Nach 60 Tagen zählt eine Lösung nur noch halb so viel wie ursprünglich.",
        jp: "これにより、リーダーボードが常に動的に保たれます。<em>今日</em>の素晴らしい成績で素早く上位に行けますが、上位を維持するには継続的な成果が必要です。<br>60日後には、クリアの価値は元の半分になります。"
        // これにより...(kore ni yori...): "Dadurch bleibt das Leaderboard dynamisch..." クリアの価値は元の半分になります (kuria no kachi wa moto no hanbun ni narimasu): "Nach 60 Tagen zählt eine Lösung nur noch halb so viel wie ursprünglich."
    }

};

