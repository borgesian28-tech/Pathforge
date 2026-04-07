## Dashboard.js Fix - Always Show "+ Add Major" Button

Find the "Recommended Majors" section (around line 281-292) and add the "+ Add Major" button inside:

FIND (around line 290):
```javascript
                  })}
                </div>
              )}
            </div>
          )}
```

REPLACE WITH:
```javascript
                  })}
                  <button 
                    onClick={function() {
                      var newMajorName = prompt('Enter the name of the major you want to add (e.g., Economics, Psychology):');
                      if (newMajorName) addNewMajor(newMajorName);
                    }}
                    disabled={addingMajor || switchingMajor}
                    style={{ 
                      padding: '6px 14px', 
                      borderRadius: 20, 
                      background: '#1a1a2e', 
                      color: accentColor, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      border: '2px dashed #2a2a3e', 
                      cursor: (addingMajor || switchingMajor) ? 'not-allowed' : 'pointer', 
                      opacity: (addingMajor || switchingMajor) ? 0.5 : 1, 
                      transition: 'all 0.2s' 
                    }}>
                    {addingMajor ? 'Adding...' : '+ Add Major'}
                  </button>
                </div>
              )}
            </div>
          )}
```

This makes the "+ Add Major" button always visible in the dropdown, so users know they can add multiple majors!
