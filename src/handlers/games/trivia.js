const handled_types = []
const categories = {
    "science_easy": "Create a trivia question about science (questions) (very easy) (global)",
    "people_easy": "Create a trivia question about famous people (questions) (very easy) (global)",
    "physics_easy": "Create a trivia question about physics (questions) (very easy) (global)",
    "math_easy": "Create a trivia question about math (questions) (very easy) (global)",
    "capitals_easy": "Create a trivia question about capitals (questions) (very easy) (global)",
    "countries_easy": "Create a trivia question about countries (questions) (very easy) (global)",
    "general_easy": "Create a general trivia questions (questions) (very easy) (global)"
}

async function prompt(prompt) {
    const res = await fetch("https://mistral.jooo.tech" + new URLSearchParams({
        c: `
You are a creative trivia question making machine, you will return one singular question with ONLY 4 options and no more or less and answer, you are to respond with only the following JSON format and have no additional text like explanations or addition context. REMEMEBR DO NOT INCLUDE ANYTHING OTHER THAN THE JSON, E.G EXPLANATIONS/ADDITIONAL CONTEXT. The reponse JSON format is as follows, the options should only be the raw options without any identification prefix, and the answer should be the index of the correct option. REMEMBER DO NOT ADD ANYTHING BEFORE OR AFTER THE DESIRED JSON RESPONSE:

{
	"question": String,
	"options": String[],
	"correct_option_index": int index_of_answer,
}

REMEMBER THAN YOUR ENTIRE RESPONSE SHOULD BE VALID, PARSABLE JSON and should not include any characters or strings outside of the JSON. DO NOT INCLUDE markdown and only provide the RAW json data. REMEMBER TO ONLY RETURN THE JSON AND NOTHING ELSE. DO NOT TRY TO FORMAT THE JSON with markdown or anything else and ONLY provide the raw JSON data minified.
        `,
        q: prompt,
        rj: 1
    }));

    return await res.json();
}

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        
    }
};