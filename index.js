const PORT = process.env.PORT || 8222
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const app = express()
const cors = require('cors') // headers
const { v4: uuidv4 } = require('uuid');
app.use(cors())
// var MongoClient = require('mongodb').MongoClient;


async function leet(link) {
    var results = []
    graphqlEndpoint = "https://leetcode.com/graphql/"
    let titleSlug = link.split('https://leetcode.com/problems/')[1].split('/')[0] || link.split('https://leetcode.com/explore/')[1] 
    const query = [`
    query questionTitle($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
            questionId
            title
            titleSlug
            difficulty
            categoryTitle
        }
    }
    `,`query questionContent($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
            content
        }
    }`,`query singleQuestionTopicTags($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
            topicTags {
                name
            }
        }
    }`];

    const variables = {
        titleSlug: titleSlug
    };

    const operationName = ['questionTitle', 'questionContent', 'singleQuestionTopicTags'];

    let headers = {
        "Host": "leetcode.com",
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }

    for (let i = 0; i < operationName.length; i++) {
        const response = await axios.post(graphqlEndpoint, {
            query: query[i],
            variables: variables,
            operationName: operationName[i]
        }, { headers }).then(response => {
            const data = response.data.data.question;
            return data
        }).catch(err => console.log(err))
        results.push(response)
    }

    const topicTags = {
        topicTags: results[2].topicTags.map(x => x.name)
    }

    results[2] = topicTags

    return results;
}


async function cforce(link){
    var results = []
    let headers = {
        "Host": "codeforces.com",
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }
    const resp = await axios.get(link, { headers })
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            let site = "codeforces"
            let titles = []
            let difficulty = [] // ### AI
            let tags = []
            let descriptions = []
            console.log("here")
            $('.header > div:nth-child(1)', html).each(function () {
                titles.push($(this).text())
            })

            $('.problem-statement > div:nth-child(2)', html).each(function () {
                descriptions.push($(this).text())
            })

            $('.tag-box', html).each(function () {
                tags.push($(this).text().replace(/\s+/g, ' ').trim())
            })

            results.push({site, titles, tags, descriptions})
            return results

        }).catch(err => console.log(err))
    return resp;
}


async function hackerrank(link){
    var results = []
    let headers = {
        "Host": "hackerrank.com",
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }
    const resp = await axios.get(link, { headers })
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            let site = "hackerrank"
            let title = ""

            let difficultyy = []
            let tags = []  // ### AI
            let descriptions = ""
            console.log("here")
            $('.page-label', html).each(function () {
                title = $(this).text()
            })

            $('.pull-right', html).each(function () {
                difficultyy.push($(this).text())
            })

            $('.challenge_problem_statement_body > div:nth-child(1) > p:nth-child(3)', html).each(function () {
                descriptions = $(this).text().replace(/\s+/g, ' ').trim()
            })


            let difficulty = difficultyy[1]

            results.push({site, title, difficulty, descriptions, tags})

            console.log(title)
            return results
        }).catch(err => console.log(err))
    let example = "It sholud be in this format example: [ 'Trees', 'Algorithm', 'Maths' ]"
    let context = "I should be max 3 tags, and should match the format and realted to DSA programming only"
    prompt = "Title: " +  results[0].title  + " Description: " + results[0].descriptions + " \n Rules: "  + context + " Example: " + example + "Format: JSON"
    let tg = await gpt4o(prompt)
    tg.replace(/[\[\]']+/g, '').split(', ')
    // console.log("Tags ===> ", tg.replace('\n', '').replace('\\',''))
    resp[0].tags = tg.replace('/\\/g', '')
    return resp;

}

// async function make_suggestions(link){

//     let context = "Generate suggestions sums based on the following sum: " + link
//     let result = await gpt4o(context)
//     return result
// }


async function gpt4o(prompt) {
    url = "https://koala.sh"
    model = "gpt-4o"
    const headers = {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Accept": "text/event-stream",
        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": `${url}/chat`,
        "Flag-Real-Time-Data": "true",
        "Visitor-ID": uuidv4().replace(/-/g, '').substring(0, 20),
        "Origin": url,
        "Alt-Used": "koala.sh",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "TE": "trailers"
    };
    messages=[{
        "role": "user",
        "content": prompt
        // "content": "Find me top DSA questions from leetcode that ask in Amazon interview repeatedly, provide me the urls for same"
    }]


    try {
        const input = messages[messages.length - 1]["content"];
        const systemMessages = messages.filter(message => message["role"] === "system").map(message => message["content"]);
        const data = {
            "input": input + (systemMessages.length ? " " + systemMessages.join(" ") : ""),
            "inputHistory": messages.slice(0, -1).filter(message => message["role"] === "user").map(message => message["content"]),
            "outputHistory": messages.filter(message => message["role"] === "assistant").map(message => message["content"]),
            "model": model
        };

        const response = await axios.post(`${url}/api/gpt/`, data, {
            headers: headers,
        });

        const chunks = response.data.split('\n').filter(chunk => chunk.startsWith("data: "));
        const parsedChunks = chunks.map(chunk => JSON.parse(chunk.slice(6)));
        const result = parsedChunks.join('').replace(/\\n/g, '\n').replace('\\','');
        // const result = parsedChunks.join('').replace(/\n/g, ''); // Join chunks and remove newline characters

        return result
    } catch (error) {
        console.error(error);
    }
    
    
}



app.get('/suggest', async function (req, res) {
    result =  await make_suggestions(req.query.link)
    return res.json(result)
    
})

app.get('/', function (req, res) {
	res.json('hello, it works')
})

app.get('/gpt4o', async function(req, res){
    const prompt = req.query.prompt.replace('%20', ' ')
    const result = await gpt4o(prompt)
    res.json(result)
})

app.get('/hackerrank', async function(req, res){
    const link = req.query.link
    const titles = await hackerrank(link)
    res.json(titles)
})


app.get('/cforce', async function(req, res){
    const link = req.query.link
    const titles = await cforce(link)
    res.json(titles)
})


app.get('/leet', async function (req, res) {
    const link = req.query.link
    const titles = await leet(link)
    res.json(titles)
})


app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))

