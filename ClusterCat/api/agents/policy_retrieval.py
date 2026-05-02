from tools.retrieval_tools import retrieve_policy


async def get_policy(intent: str, query: str):
    return await retrieve_policy(query=query, intent=intent)
