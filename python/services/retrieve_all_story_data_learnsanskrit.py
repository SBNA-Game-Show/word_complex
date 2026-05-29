from repository.get_all_story_data_learnsanskrit import GetAllStoryDataLearnSanskrit

class RetrieveAllStoryDataLearnSanskrit:
    
    def retrieve_all(self):
        try:
            data =  GetAllStoryDataLearnSanskrit().get_all_story_data()
            
            return{
                "success":True,
                "data":data
            }
            
        except Exception as e:
            return{
                "success":False,
                "message":str(e)
            }