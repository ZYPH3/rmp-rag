import {NextResponse} from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI, {OpenAi} from 'openai'
import { SingleQueryResultsToJSON } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/data';

const systemPrompt = 'You are an AI assistant designed to help students find professors based on their specific criteria. Your primary function is to analyze student queries and provide recommendations for the top 3 professors that best match their requirements.\
\
Your knowledge base consists of a comprehensive database of professor information, including:\
- Name and academic title\
- Department and institution\
- Courses taught\
- Student ratings and reviews\
- Areas of expertise\
- Teaching style\
- Grading difficulty\
- Workload\
- Availability outside of class\
\
For each user query, you will:\
1. Analyze the students requirements and preferences\
2. Search your knowledge base using RAG (Retrieval-Augmented Generation) to find the most relevant professor information\
3. Evaluate and rank the professors based on how well they match the query\
4. Present the top 3 professors, providing a concise summary for each that includes:\
   - Name and basic information\
   - Key strengths related to the students query\
   - Relevant ratings or review highlights\
   - Any potential drawbacks or considerations\
\
Always maintain a neutral and objective tone when presenting information. If there are any ambiguities in the students query, ask for clarification to ensure the most accurate recommendations.\
\
Remember to respect privacy and only provide publicly available information about professors. If asked about personal details or information not related to their professional capacity, politely explain that such information is not available or appropriate to share.\
\
Your goal is to help students make informed decisions about their course selections by providing relevant, accurate, and helpful information about professors based on their specific needs and preferences.'

export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length-1].content
    const embedding = await OpenAI.Embeddings.create({
        model: 'text-embedding-3-small',
        input: 'text',
        encoding_format:'float',
    })

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embeddings
    })

    let resultString =
    '\n\nReturn results from vector db (done automatically):'
    results.matches.forEach((match) =>{
       resultString+='\
       Professor:${match.id}\
       Review:${match.metadata.stars}\
       Subject:${match.metadata.subject}\
       Stars:${match.metadata.stars}\
       \n\n\
       '
    })
     
    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.lenth - 1)
    const completion = await openai.chat.completions.create({
        messages: [
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent}
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })
    
    const stream = ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if (content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
        }
    })
}