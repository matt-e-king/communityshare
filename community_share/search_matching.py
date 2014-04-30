from community_share.models.search import Search

class BadSearch(Exception):
    pass

def find_matching_community_partners(search):
    if search.searcher_role != 'educator':
        raise BadSearch()
    if search.searching_for_role != 'partner':
        raise BadSearch()
    searches = Search.get_many_ordered_by_label_matches(search.labels)
    return searches
    


