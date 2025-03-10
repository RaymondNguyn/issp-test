from plyer import notification
import pandas as pd 
import statistics
import time
import threading
import sys
import os

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

data1 = read_file(f'{file}')
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
    for column in cols:
        store_list.append(column)
    for column in cols:
        store_list.append(values[column].tolist())
    
    return store_list

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
            time.sleep(1800)
            if value > upper_limit:
                # Sends a notification with the title of system alert and the message of which section sent the warning.
                notification.notify(
                    title="System Alert",
                    message=f"WARNING SECTION {name} IS ABNORMALLY HIGH: {value}",
                    app_name=f"Section {name}",
                    timeout=5  # Notification disappears after 5 seconds
                )
            elif value < lower_limit:
                notification.notify(
                    title="System Alert",
                    message=f"WARNING SECTION {name} IS ABNORMALLY LOW: {value}",
                    app_name=f"Section {name}",
                    timeout=5  # Notification disappears after 5 seconds
                )
        # This prevents the loop from running constantly by setting run to False.
        run = False

# main
def main():
    # threads to run concurrrently
    threads = []
    # get the length of the dataset
    length = len(cols)
    # for each number in the length of columns, e.g 8 columns would be 0...7.
    for num in range(length):
        # length of the cols and the 
        data_store = (num + length)
        data_thread = threading.Thread(target=check_boundary,args=(get_list()[data_store],get_list()[num]))
        data_thread.start()
        threads.append(data_thread)
    # join the threads to stop them after execution.
    for thread in threads:
        thread.join()
    
if __name__=="__main__":
    main()