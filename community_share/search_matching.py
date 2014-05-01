from community_share.models.search import Search

def find_matching_searches(search):
    searches = Search.get_many_ordered_by_label_matches(
        search.labels, searcher_role=search.searching_for_role,
        searching_for_role=search.searcher_role)
    return searches
    


