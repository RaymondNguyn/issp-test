import pandas as pd 
import statistics
import time
import threading
import sys
import os
from email.message import EmailMessage
import smtplib
import ssl
import certifi  # Use certifi for SSL certificates

# PLEASE KEEP IN MIND:
# When running my code you can't do keyboard interupts due to the use of threads.
# To stop the program after execution simply kill the terminal.

# 1 EXTRACT DATA
file = sys.argv[1]

# read from either CSV or Excel
def read_file(file_path):
    ext = os.path.splitext(file_path)[1]
    if ext == ".csv":
        return pd.read_csv(file_path)
    elif ext == ".xlsx":
        return pd.read_excel(file_path)
    else:
        raise ValueError("Error: Please supply either excel(.xlsx) or csv(.csv) files.")

data1 = read_file(file)
data1 = data1.drop('Date & Time', axis=1)

# 2 CLEAN DATA
cols = data1.columns.values
# This current method for cleaning changes all Nan data entries to 0.
def clean_data():
    data1_cleaned = data1.fillna(0)
    return data1_cleaned
# Selecting each individual column and turning the data into a list so it can be iterated over.
def get_list():
    store_list = []
    values = clean_data()
    # add the names of the columns in the file into store_list index 0 to 9.
    for column in cols:
        store_list.append(column)
    # add the data of the columns as lists in the file into store_list index 10 to 19.
    for column in cols:
        store_list.append(values[column].tolist())
    return store_list

# GET emial details
email_sender = "hk580dev@gmail.com"
email_password = "seorymxmfqqgczhe"
email_reciever = "hkakooza1@my.bcit.ca"

# Create SSL context for secure connection
context_block = ssl.create_default_context(cafile=certifi.where())

# Check the boundary
def check_boundary(dataset,name):
    # While loop will keep looking at each value and report the status 30 seconds later
    run = True
    while run:
        # Getting the mean of the values, setting the boundary, upper and lower limits.
        mean = statistics.mean(dataset)
        boundary = (mean * 0.15)
        upper_limit = (mean + boundary)
        lower_limit = (mean - boundary)
        # Iterating over each value to see if its too high, too low or normal.
        for value in dataset:  
            # Waiting 30 minutes (1800 seconds) before it processes the value.
            time.sleep(10)
            if value > upper_limit:
                # Sends a notification with the title of system alert and the message of which section sent the warning.
                body = f"WARNING SECTION {name} IS ABNORMALLY HIGH: {value}"
            elif value < lower_limit:
                body = f"WARNING SECTION {name} IS ABNORMALLY LOW: {value}"
            else:
                # This value is not really necessary since it just lets the user know that their value is normal.
                # It is just here for testing purposes.
                body = f"Normal for sec {name}, value = {value}"
            # Create the email
            em = EmailMessage()
            em['From'] = email_sender
            em['To'] = email_reciever
            em['Subject'] = name
            em.set_content(body)
            # Send email
            # smpt.gmail.com (host) this defines where the sender email is coming from (in this case it has to be gmail).
            # 465 is the port
            # context is the SSL certificate
            with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context_block) as smtp:
                # This is where the app logs in.
                smtp.login(email_sender, email_password)
                # This is the actual contents of the email.
                smtp.sendmail(email_sender, email_reciever, em.as_string())
        # This prevents the loop from running constantly by setting run to False.
        run = False
        # MAYBE REMOVE THIS SINCE WE WANT THE LOOP TO RUN INDEFINITELY

# main
def main():
    # threads to run concurrrently
    threads = []
    # get the length of the dataset
    length = len(cols)
    for num in range(length):
        # data_store will be the index of the lists of data from each column.
        data_store = (num + length)
        data_thread = threading.Thread(target=check_boundary,args=(get_list()[data_store],get_list()[num]))
        data_thread.start()
        threads.append(data_thread)
    # join the threads to stop them after execution.
    for thread in threads:
        thread.join()
    
if __name__=="__main__":
    main()