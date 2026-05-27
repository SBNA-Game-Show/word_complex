
class FetchNewFable:
    """Fetches the fable from learnsanskrit.cc cleans, tokenize both versions
    and writes to data folder
    """
    
    ## step:1 Check if ID exists 1. CREATE A GENERIC READER CLASS THAT FILE NAME AS INPUT AND OUTPUTS THE DATA IN JSON FORMAT
    
    ## step:2 Fetch vendor id
    
    ## step:3 Call RetrieveStoryFromLearnSanskrit
    
    ## step:4 Call ExtractDataFromLearnSanskrit
    
    ## step:5 Call TokenizeEnglishVersion
    
    ## step 6 Call TokenizeSanskritVersion
    
    ## step 7 Call WriteToFileSystem "WRITES TO DATA FOLDER"
    
    ## STEP 8 TO WRITE TO DATABASE 1. CREATE MONOGO SCHEMA 2. CREATE A CLASS THAT TAKES THE OUTPUT FROM TOKENIZEDSANSKRIT VERSION AND WRITES TO THE DATABASE
